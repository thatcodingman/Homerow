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

// ============ Quote bank (mode: quotes) ============
const QUOTES = [
  'The quick brown fox jumps over the lazy dog while the sun sets slowly behind the hills.',
  'In the middle of every difficulty lies opportunity waiting patiently to be noticed and seized.',
  'Not all those who wander are lost, some simply enjoy the freedom of an open road.',
  'Simplicity is the ultimate sophistication, especially when everything else demands more attention.',
  'A journey of a thousand miles begins with a single step taken with quiet confidence.',
  'The only way to do great work is to love what you do and keep doing it daily.',
  'Practice does not make perfect, only perfect practice makes perfect over a long stretch of time.',
  'Well begun is half done, but the second half is where most people quietly give up.',
  'The best time to plant a tree was twenty years ago, the second best time is now.',
  'Small daily improvements are the key to staggering long term results if you stay consistent.'
];

function generatePassage(count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  return out.join(' ');
}

function generateQuotePassage(minLength) {
  let text = '';
  while (text.length < minLength) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    text += (text ? ' ' : '') + q;
  }
  return text;
}

function generatePunctuationPassage(count) {
  const punct = [',', '.', '!', '?', ';', ':'];
  const out = [];
  let startOfSentence = true;
  for (let i = 0; i < count; i++) {
    let w = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (startOfSentence) {
      w = w.charAt(0).toUpperCase() + w.slice(1);
      startOfSentence = false;
    }
    if (Math.random() < 0.16) {
      const p = punct[Math.floor(Math.random() * punct.length)];
      w += p;
      if (p === '.' || p === '!' || p === '?') startOfSentence = true;
    }
    out.push(w);
  }
  let text = out.join(' ');
  if (!/[.!?]$/.test(text)) text += '.';
  return text;
}

function buildTarget(mode, duration) {
  const wordCount = Math.max(60, duration * 6);
  if (mode === 'quotes') return generateQuotePassage(wordCount * 5.5);
  if (mode === 'punctuation') return generatePunctuationPassage(wordCount);
  return generatePassage(wordCount);
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
  const score = netWPM * (accuracy / 100);
  return { netWPM, rawWPM, accuracy, correct, total, score };
}

function computeConsistency(samples) {
  if (samples.length < 2) return 100;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 100;
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
  const stdev = Math.sqrt(variance);
  return Math.round(Math.max(0, Math.min(100, 100 - (stdev / mean) * 100)));
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

// ============ Personal best tracking (localStorage, never leaves the browser) ============
function getBests() {
  try {
    const raw = localStorage.getItem('homerow-bests');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function updateBest(duration, wpm) {
  try {
    const bests = getBests();
    const isNew = !bests[duration] || wpm > bests[duration];
    if (isNew) {
      bests[duration] = wpm;
      localStorage.setItem('homerow-bests', JSON.stringify(bests));
    }
    return { best: bests[duration], isNew };
  } catch (e) {
    return { best: wpm, isNew: false };
  }
}

// ============ Streak tracking (localStorage, calendar-day based) ============
function getStreakData() {
  try {
    const raw = localStorage.getItem('homerow-streak');
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
  } catch (e) {
    return { count: 0, lastDate: null };
  }
}

function dayKey(d) { return d.toISOString().slice(0, 10); }

function recordStreak() {
  const data = getStreakData();
  const today = dayKey(new Date());
  if (data.lastDate === today) return data.count;
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const newCount = data.lastDate === yesterday ? data.count + 1 : 1;
  try {
    localStorage.setItem('homerow-streak', JSON.stringify({ count: newCount, lastDate: today }));
  } catch (e) {}
  return newCount;
}

function currentStreakDisplay() {
  const data = getStreakData();
  if (!data.lastDate) return 0;
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (data.lastDate === today || data.lastDate === yesterday) return data.count;
  return 0;
}

// ============ Keyboard heatmap ============
const KB_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

function renderHeatmap(keyEl, wrapEl, errorCounts) {
  if (!keyEl || !wrapEl) return;
  const counts = Object.values(errorCounts);
  if (counts.length === 0) { wrapEl.hidden = true; return; }
  const max = Math.max(1, ...counts);
  let html = '';
  KB_ROWS.forEach((row) => {
    html += '<div class="kb-row">';
    row.forEach((k) => {
      const count = errorCounts[k] || 0;
      const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
      html += `<span class="key heat-${level}" title="${count} miss${count === 1 ? '' : 'es'}">${k}</span>`;
    });
    html += '</div>';
  });
  keyEl.innerHTML = html;
  wrapEl.hidden = false;
}

// ============ Lightweight number tween for reactive stats ============
function animateNumber(el, from, to, suffix, durationMs) {
  if (from === to) { el.textContent = to + suffix; return; }
  const start = performance.now();
  const span = to - from;
  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const val = Math.round(from + span * t);
    el.textContent = val + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function pulseMilestone(el) {
  el.classList.remove('milestone');
  // Force reflow so the animation can retrigger
  void el.offsetWidth;
  el.classList.add('milestone');
}

// ============ DOM refs ============
const passageEl = document.getElementById('passage');
const caretEl = document.getElementById('caret');
const hiddenInput = document.getElementById('hiddenInput');
const focusHint = document.getElementById('focusHint');
const countdownEl = document.getElementById('countdown');
const typeZone = document.getElementById('typeZone');
const durationBtns = document.querySelectorAll('.duration-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const modeRow = document.querySelector('.mode-row');
const durationRow = document.querySelector('.duration-row');
const soundToggle = document.getElementById('soundToggle');
const timeStat = document.getElementById('timeStat');
const wpmStat = document.getElementById('wpmStat');
const accStat = document.getElementById('accStat');
const timeProgressFill = document.getElementById('timeProgressFill');
const stateDot = document.getElementById('stateDot');
const stateText = document.getElementById('stateText');
const streakBadge = document.getElementById('streakBadge');
const sparkline = document.getElementById('sparkline');
const resultsCard = document.getElementById('resultsCard');
const resultWPM = document.getElementById('resultWPM');
const resultAccuracy = document.getElementById('resultAccuracy');
const resultScore = document.getElementById('resultScore');
const resultRaw = document.getElementById('resultRaw');
const resultErrors = document.getElementById('resultErrors');
const resultConsistency = document.getElementById('resultConsistency');
const resultChars = document.getElementById('resultChars');
const restartBtn = document.getElementById('restartBtn');
const shareBtn = document.getElementById('shareBtn');
const saveImageBtn = document.getElementById('saveImageBtn');
const bestBadge = document.getElementById('bestBadge');
const streakLine = document.getElementById('streakLine');
const heatmapWrap = document.getElementById('heatmapWrap');
const keyboardEl = document.getElementById('keyboard');

if (passageEl) {
  // ============ State ============
  let duration = 30;
  let mode = 'words';
  let target = buildTarget(mode, duration);
  let startTime = null;
  let timerInterval = null;
  let running = false;
  let finished = false;
  let wpmSamples = [];
  let lastTypedLength = 0;
  let keyErrorCounts = {};
  let lastWpmShown = 0;
  let lastAccShown = 100;
  let wpmMilestoneHit = false;
  let accMilestoneHit = false;
  let countdownActive = false;
  let countdownTimer = null;

  // Show any existing streak on load
  const existingStreak = currentStreakDisplay();
  if (streakBadge) {
    if (existingStreak > 1) {
      streakBadge.textContent = `\uD83D\uDD25 ${existingStreak} day streak`;
      streakBadge.hidden = false;
    } else {
      streakBadge.hidden = true;
    }
  }

  function hideFocusHint() {
    if (!focusHint || focusHint.hidden) return;
    focusHint.classList.add('fading');
    setTimeout(() => {
      focusHint.hidden = true;
      focusHint.classList.remove('fading');
    }, 200);
  }

  function startCountdown() {
    if (!countdownEl || countdownActive || running || finished) return;
    countdownActive = true;
    const seq = ['3', '2', '1', 'GO'];
    let i = 0;
    countdownEl.hidden = false;
    countdownEl.classList.add('show');
    function step() {
      if (!countdownActive) return;
      countdownEl.textContent = seq[i];
      countdownEl.classList.remove('pop');
      void countdownEl.offsetWidth;
      countdownEl.classList.add('pop');
      i++;
      if (i < seq.length) {
        countdownTimer = setTimeout(step, 260);
      } else {
        countdownTimer = setTimeout(() => {
          countdownEl.classList.remove('show');
          setTimeout(() => { if (countdownEl) countdownEl.hidden = true; }, 150);
          countdownActive = false;
        }, 260);
      }
    }
    step();
  }

  function cancelCountdown() {
    if (!countdownActive) return;
    countdownActive = false;
    clearTimeout(countdownTimer);
    if (countdownEl) {
      countdownEl.classList.remove('show');
      countdownEl.hidden = true;
    }
  }

  function setState(label) {
    if (!stateText || !stateDot) return;
    stateText.textContent = label;
    stateText.classList.remove('starting', 'running', 'finished');
    stateDot.classList.remove('starting', 'running', 'finished');
    const cls = label.toLowerCase();
    if (cls === 'starting' || cls === 'running' || cls === 'finished') {
      stateText.classList.add(cls);
      stateDot.classList.add(cls);
    }
  }

  function setControlsQuiet(quiet) {
    if (modeRow) modeRow.classList.toggle('quiet', quiet);
    if (durationRow) durationRow.classList.toggle('quiet', quiet);
  }

  function updateCaret() {
    if (!caretEl) return;
    const cur = passageEl.querySelector('.char.current');
    if (!cur) { caretEl.style.opacity = '0'; return; }
    const top = passageEl.offsetTop + cur.offsetTop - passageEl.scrollTop;
    const left = passageEl.offsetLeft + cur.offsetLeft;
    caretEl.style.transform = `translate(${left}px, ${top}px)`;
    caretEl.style.height = cur.offsetHeight + 'px';
  }

  function scrollToCurrentLine(cur) {
    if (!cur) return;
    const lineHeight = parseFloat(getComputedStyle(passageEl).lineHeight) || 41;
    passageEl.scrollTop = Math.max(0, cur.offsetTop - lineHeight);
  }

  function renderPassage() {
    const typed = hiddenInput.value;
    const states = diffStates(typed, target);
    const cursor = typed.length;
    let wordStart = cursor, wordEnd = cursor;
    while (wordStart > 0 && target[wordStart - 1] !== ' ') wordStart--;
    while (wordEnd < target.length && target[wordEnd] !== ' ') wordEnd++;

    let html = '';
    for (let i = 0; i < target.length; i++) {
      let cls = states[i];
      if (i === cursor) cls += ' current';
      if (i >= wordStart && i < wordEnd && states[i] !== 'incorrect') cls += ' in-word';
      if (states[i] === 'pending' && i - cursor > 120) cls += ' far';
      if (states[i] === 'correct' && cursor - i > 60) cls += ' behind';
      if (i === cursor - 1 && states[i] === 'incorrect') cls += ' flash';
      const ch = target[i] === ' ' ? ' ' : escapeChar(target[i]);
      html += `<span class="char ${cls}">${ch}</span>`;
    }
    passageEl.innerHTML = html;
    const curEl = passageEl.querySelector('.char.current');
    scrollToCurrentLine(curEl);
    updateCaret();
  }

  function escapeChar(c) {
    return c.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  }

  function trackKeyError(val) {
    if (val.length > lastTypedLength) {
      const idx = val.length - 1;
      if (target[idx] && target[idx] !== ' ' && val[idx] !== target[idx]) {
        const key = target[idx].toLowerCase();
        if (/[a-z]/.test(key)) keyErrorCounts[key] = (keyErrorCounts[key] || 0) + 1;
      }
    }
    lastTypedLength = val.length;
  }

  function startTimer() {
    running = true;
    startTime = Date.now();
    setState('Starting');
    setControlsQuiet(true);
    typeZone.classList.add('active-test');
    setTimeout(() => { if (running) setState('Running'); }, 220);
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      timeStat.textContent = Math.ceil(remaining);

      const warning = remaining <= 5 && remaining > 0;
      timeStat.classList.toggle('warning', warning);
      if (timeProgressFill) {
        timeProgressFill.style.width = Math.max(0, (remaining / duration) * 100) + '%';
        timeProgressFill.classList.toggle('warning', warning);
      }

      const stats = computeStats(hiddenInput.value, target, elapsed);
      const roundedWpm = Math.round(stats.netWPM);
      const roundedAcc = Math.round(stats.accuracy);
      animateNumber(wpmStat, lastWpmShown, roundedWpm, '', 200);
      animateNumber(accStat, lastAccShown, roundedAcc, '%', 200);

      if (roundedWpm >= 50 && !wpmMilestoneHit) { wpmMilestoneHit = true; pulseMilestone(wpmStat); }
      if (roundedAcc >= 95 && !accMilestoneHit && stats.total > 10) { accMilestoneHit = true; pulseMilestone(accStat); }

      lastWpmShown = roundedWpm;
      lastAccShown = roundedAcc;

      wpmSamples.push(roundedWpm);
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
    sparkline.innerHTML = `<polyline points="${pts.join(' ')}" fill="none" stroke="#F5C34E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(245,195,78,.5));" />`;
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
    resultScore.textContent = Math.round(stats.score);
    resultRaw.textContent = Math.round(stats.rawWPM);
    resultErrors.textContent = stats.total - stats.correct;
    resultConsistency.textContent = computeConsistency(wpmSamples) + '%';
    resultChars.textContent = `${stats.correct} / ${stats.total}`;

    const { best, isNew } = updateBest(duration, Math.round(stats.netWPM));
    if (bestBadge) {
      bestBadge.textContent = isNew ? 'New personal best!' : `Personal best at ${duration}s: ${best} WPM`;
      bestBadge.hidden = false;
    }

    const streakCount = recordStreak();
    if (streakLine) {
      if (streakCount > 1) {
        streakLine.textContent = `\uD83D\uDD25 ${streakCount} day streak`;
        streakLine.hidden = false;
      } else {
        streakLine.hidden = true;
      }
    }
    if (streakBadge) {
      if (streakCount > 1) {
        streakBadge.textContent = `\uD83D\uDD25 ${streakCount} day streak`;
        streakBadge.hidden = false;
      } else {
        streakBadge.hidden = true;
      }
    }

    renderHeatmap(keyboardEl, heatmapWrap, keyErrorCounts);

    setState('Finished');
    setControlsQuiet(false);

    resultsCard.classList.add('show');
    passageEl.classList.add('blurred');
    typeZone.classList.remove('focused');
    typeZone.classList.remove('active-test');
    timeStat.classList.remove('warning');
    if (timeProgressFill) timeProgressFill.classList.remove('warning');
    if (caretEl) caretEl.style.opacity = '0';
    focusHint.hidden = true;
    hiddenInput.blur();
  }

  function reset() {
    clearInterval(timerInterval);
    running = false;
    finished = false;
    startTime = null;
    wpmSamples = [];
    lastTypedLength = 0;
    keyErrorCounts = {};
    lastWpmShown = 0;
    lastAccShown = 100;
    wpmMilestoneHit = false;
    accMilestoneHit = false;
    target = buildTarget(mode, duration);
    hiddenInput.value = '';
    passageEl.scrollTop = 0;
    timeStat.textContent = duration;
    timeStat.classList.remove('warning');
    wpmStat.textContent = '0';
    accStat.textContent = '100%';
    if (timeProgressFill) { timeProgressFill.style.width = '100%'; timeProgressFill.classList.remove('warning'); }
    if (sparkline) sparkline.innerHTML = '';
    resultsCard.classList.remove('show');
    passageEl.classList.remove('blurred');
    if (bestBadge) bestBadge.hidden = true;
    if (streakLine) streakLine.hidden = true;
    if (heatmapWrap) heatmapWrap.hidden = true;
    setState('Ready');
    setControlsQuiet(false);
    cancelCountdown();
    renderPassage();
  }

  hiddenInput.addEventListener('input', () => {
    if (finished) return;
    cancelCountdown();
    if (!running) startTimer();
    trackKeyError(hiddenInput.value);
    playClick();
    renderPassage();
    if (hiddenInput.value.length >= target.length) finish();
  });

  passageEl.addEventListener('click', () => hiddenInput.focus({ preventScroll: true }));
  focusHint.addEventListener('click', () => hiddenInput.focus({ preventScroll: true }));
  hiddenInput.addEventListener('focus', () => { hideFocusHint(); startCountdown(); typeZone.classList.add('focused'); });
  hiddenInput.addEventListener('blur', () => { if (!finished) { focusHint.hidden = false; typeZone.classList.remove('focused'); } });

  durationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      durationBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      duration = parseInt(btn.dataset.duration, 10);
      reset();
    });
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
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

  if (saveImageBtn) {
    saveImageBtn.addEventListener('click', () => {
      const canvas = document.getElementById('shareCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const draw = () => {
        ctx.fillStyle = '#14181F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const grad = ctx.createRadialGradient(600, 160, 40, 600, 160, 520);
        grad.addColorStop(0, 'rgba(245,195,78,.16)');
        grad.addColorStop(1, 'rgba(245,195,78,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#F5C34E';
        ctx.font = '700 150px "Red Hat Mono", monospace';
        ctx.fillText(resultWPM.textContent, 600, 300);

        ctx.font = '600 30px "Red Hat Mono", monospace';
        ctx.fillStyle = '#C7CBD1';
        ctx.fillText('WORDS PER MINUTE', 600, 350);

        ctx.font = '500 28px "Red Hat Mono", monospace';
        ctx.fillStyle = '#6B7280';
        ctx.fillText(`${resultAccuracy.textContent} accuracy \u00B7 ${duration}s ${mode} test`, 600, 420);

        ctx.font = '600 34px "Special Elite", cursive';
        ctx.fillStyle = '#FBF7EC';
        ctx.fillText('Home Row', 600, 560);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'home-row-result.png';
          a.click();
          URL.revokeObjectURL(url);
        });
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(draw);
      } else {
        draw();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      reset();
      hiddenInput.blur();
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && (finished || document.activeElement !== hiddenInput)) {
      e.preventDefault();
      reset();
    }
  });

  reset();
}
