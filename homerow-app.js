// ============ Word bank ============
const WORDS = ('the of and to in a is that for it as was with be by on not he this are or his from at which but have '
  + 'an they you all one had her she there their been if more when will would who so no out up into over think also '
  + 'its our work life only can still should after being now made before through years way day come could new some '
  + 'other than then first any these people them how know time see him two look more write use word how said an each '
  + 'she which do their time if will way about many then them write would like so these her long make thing man great '
  + 'where help through much before line right too mean old any same tell boy follow came want show also around form '
  + 'three small set put end does another well large must big even such because turn here why ask went men read need '
  + 'land different home us move try kind hand picture again change off play spell air away animal house point page '
  + 'letter mother answer found study still learn should world').split(' ');

function generatePassage(count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  return out.join(' ');
}

// ============ Diff / stats — tested logic ============
function diffStates(typed, target) {
  const result = [];
  for (let i = 0; i < target.length; i++) {
    if (i >= typed.length) result.push('pending');
    else result.push(typed[i] === target[i] ? 'correct' : 'incorrect');
  }
  return result;
}

function computeStats(typed, target, elapsedSeconds) {
  const minutes = elapsedSeconds / 60;
  let correct = 0;
  const len = Math.min(typed.length, target.length);
  for (let i = 0; i < len; i++) if (typed[i] === target[i]) correct++;
  const total = typed.length;
  const netWPM = minutes > 0 ? (correct / 5) / minutes : 0;
  const rawWPM = minutes > 0 ? (total / 5) / minutes : 0;
  const accuracy = total > 0 ? (correct / total) * 100 : 100;
  return { netWPM, rawWPM, accuracy, correct, total };
}

// ============ Synthesized key-click sound (no audio file needed) ============
let audioCtx = null;
function playClick() {
  if (!soundToggle || !soundToggle.checked) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200 + Math.random() * 200;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Web Audio unavailable — fail silently, sound is a bonus, not required
  }
}

// ============ DOM refs ============
const passageEl = document.getElementById('passage');
const hiddenInput = document.getElementById('hiddenInput');
const focusHint = document.getElementById('focusHint');
const durationBtns = document.querySelectorAll('.duration-btn');
const soundToggle = document.getElementById('soundToggle');
const timeStat = document.getElementById('timeStat');
const wpmStat = document.getElementById('wpmStat');
const accStat = document.getElementById('accStat');
const sparkline = document.getElementById('sparkline');
const resultsCard = document.getElementById('resultsCard');
const resultWPM = document.getElementById('resultWPM');
const resultAccuracy = document.getElementById('resultAccuracy');
const resultRaw = document.getElementById('resultRaw');
const resultChars = document.getElementById('resultChars');
const restartBtn = document.getElementById('restartBtn');
const shareBtn = document.getElementById('shareBtn');

if (passageEl) {
  // ============ State ============
  let duration = 30;
  let target = generatePassage(60);
  let startTime = null;
  let timerInterval = null;
  let running = false;
  let finished = false;
  let wpmSamples = [];

  function renderPassage() {
    const typed = hiddenInput.value;
    const states = diffStates(typed, target);
    let html = '';
    for (let i = 0; i < target.length; i++) {
      const cls = states[i] + (i === typed.length ? ' current' : '');
      const ch = target[i] === ' ' ? '&nbsp;' : escapeChar(target[i]);
      html += `<span class="char ${cls}">${ch}</span>`;
    }
    passageEl.innerHTML = html;
  }

  function escapeChar(c) {
    return c.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  }

  function startTimer() {
    running = true;
    startTime = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      timeStat.textContent = Math.ceil(remaining);

      const stats = computeStats(hiddenInput.value, target, elapsed);
      wpmStat.textContent = Math.round(stats.netWPM);
      accStat.textContent = Math.round(stats.accuracy) + '%';
      wpmSamples.push(Math.round(stats.netWPM));
      drawSparkline();

      if (remaining <= 0) finish();
    }, 250);
  }

  function drawSparkline() {
    if (!sparkline || wpmSamples.length < 2) return;
    const w = 500, h = 60;
    const max = Math.max(...wpmSamples, 10);
    const pts = wpmSamples.map((v, i) => {
      const x = (i / (wpmSamples.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    sparkline.innerHTML = `<polyline points="${pts.join(' ')}" fill="none" stroke="#E8B84B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  }

  function finish() {
    if (finished) return;
    finished = true;
    running = false;
    clearInterval(timerInterval);
    const elapsed = (Date.now() - startTime) / 1000;
    const stats = computeStats(hiddenInput.value, target, elapsed);

    resultWPM.textContent = Math.round(stats.netWPM);
    resultAccuracy.textContent = Math.round(stats.accuracy) + '%';
    resultRaw.textContent = Math.round(stats.rawWPM);
    resultChars.textContent = `${stats.correct} / ${stats.total}`;
    resultsCard.classList.add('show');
    passageEl.classList.add('blurred');
    focusHint.hidden = true;
    hiddenInput.blur();
  }

  function reset() {
    clearInterval(timerInterval);
    running = false;
    finished = false;
    startTime = null;
    wpmSamples = [];
    target = generatePassage(60);
    hiddenInput.value = '';
    timeStat.textContent = duration;
    wpmStat.textContent = '0';
    accStat.textContent = '100%';
    if (sparkline) sparkline.innerHTML = '';
    resultsCard.classList.remove('show');
    passageEl.classList.remove('blurred');
    renderPassage();
  }

  hiddenInput.addEventListener('input', () => {
    if (finished) return;
    if (!running) startTimer();
    playClick();
    renderPassage();
    if (hiddenInput.value.length >= target.length) finish();
  });

  passageEl.addEventListener('click', () => hiddenInput.focus());
  focusHint.addEventListener('click', () => hiddenInput.focus());
  hiddenInput.addEventListener('focus', () => { focusHint.hidden = true; });
  hiddenInput.addEventListener('blur', () => { if (!finished) focusHint.hidden = false; });

  durationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      durationBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      duration = parseInt(btn.dataset.duration, 10);
      reset();
    });
  });

  restartBtn.addEventListener('click', reset);

  shareBtn.addEventListener('click', () => {
    const text = `${resultWPM.textContent} WPM at ${resultAccuracy.textContent} accuracy on Home Row — homerow.app`;
    navigator.clipboard.writeText(text);
    const original = shareBtn.textContent;
    shareBtn.textContent = 'Copied';
    setTimeout(() => { shareBtn.textContent = original; }, 1200);
  });

  reset();
}
