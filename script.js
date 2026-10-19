const dial = document.getElementById('dial');
const timeEl = document.getElementById('time');
const modeLabel = document.getElementById('modeLabel');
const statusEl = document.getElementById('status');
const modes = document.getElementById('modes');
const dots = [...document.getElementById('dots').children];
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');

const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS = { focus: 'Focus session', short: 'Short break', long: 'Long break' };

let mode = 'focus';
let remaining = DURATIONS[mode];
let running = false;
let endAt = 0;
let intervalId = null;
let completed = 0;
let audio = null;

function pad(value) {
  return String(value).padStart(2, '0');
}

function render() {
  const total = DURATIONS[mode];
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  timeEl.textContent = `${pad(minutes)}:${pad(seconds)}`;
  dial.style.setProperty('--p', (remaining / total) * 100);
  dial.classList.toggle('is-break', mode !== 'focus');
  document.title = running ? `${timeEl.textContent} · ${LABELS[mode]}` : 'Pomodoro Timer';

  dots.forEach((dot, index) => dot.classList.toggle('done', index < completed % 4 || (completed > 0 && completed % 4 === 0)));
}

function setMode(next) {
  mode = next;
  remaining = DURATIONS[mode];
  running = false;
  clearInterval(intervalId);

  modes.querySelectorAll('.mode').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.mode === mode);
  });

  modeLabel.textContent = LABELS[mode];
  startBtn.textContent = 'Start';
  render();
}

function beep() {
  try {
    audio = audio || new AudioContext();
    const now = audio.currentTime;
    [0, 0.18].forEach((offset, index) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = index === 0 ? 660 : 880;
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  } catch (error) {
    return;
  }
}

function tick() {
  remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  render();

  if (remaining === 0) {
    clearInterval(intervalId);
    running = false;
    beep();
    advance(true);
  }
}

function advance(countSession) {
  if (countSession && mode === 'focus') completed++;

  if (mode === 'focus') {
    setMode(completed > 0 && completed % 4 === 0 ? 'long' : 'short');
    statusEl.textContent = 'Break earned. Press start when you are ready.';
  } else {
    setMode('focus');
    statusEl.textContent = 'Break over. Ready for another focus session?';
  }

  render();
}

function toggle() {
  if (running) {
    running = false;
    clearInterval(intervalId);
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    startBtn.textContent = 'Resume';
    statusEl.textContent = 'Paused.';
    render();
    return;
  }

  running = true;
  endAt = Date.now() + remaining * 1000;
  startBtn.textContent = 'Pause';
  statusEl.textContent = mode === 'focus' ? 'Focus. Put the phone down.' : 'Break time. Step away.';
  intervalId = setInterval(tick, 250);
  render();
}

modes.addEventListener('click', (event) => {
  const btn = event.target.closest('.mode');
  if (!btn || btn.dataset.mode === mode) return;
  setMode(btn.dataset.mode);
  statusEl.textContent = 'Mode changed. Press start.';
});

startBtn.addEventListener('click', toggle);

resetBtn.addEventListener('click', () => {
  setMode(mode);
  statusEl.textContent = 'Reset. Ready when you are.';
});

skipBtn.addEventListener('click', () => {
  clearInterval(intervalId);
  running = false;
  advance(false);
  statusEl.textContent = 'Skipped. Press start for the next round.';
});

setMode('focus');
