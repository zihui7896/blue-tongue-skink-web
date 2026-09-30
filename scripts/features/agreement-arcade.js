import { CHALLENGES, createChallenge } from './agreement-challenges.js?v=chase-input-5';
import { DIFFICULTIES, challengeCopy } from './agreement-difficulty.js?v=time-option-4';

const time = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${(ms % 60000 / 1000).toFixed(1).padStart(4, '0')}`;
function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function initAgreementGame() {
  const root = document.querySelector('[data-agreement-game]');
  if (!root) return { setVisible() {} };
  let visible = false, state = 'intro', mode = 'casual', difficulty = 'hard', practice = false;
  try { const saved = localStorage.getItem('landou-agreement-difficulty'); if (DIFFICULTIES[saved]) difficulty = saved; } catch { /* Optional storage. */ }
  let timeLimited = true, runTimed = true;
  try { timeLimited = localStorage.getItem('landou-agreement-time-limit') !== 'false'; } catch { /* Optional storage. */ }
  let order = [], index = 0, elapsed = 0, errors = 0, remaining = 0, engine;
  let raf = 0, last = 0, sound = false, audio, best = null;
  const isTimedRecord = () => state === 'intro' ? timeLimited : runTimed;
  const key = () => `landou-agreement-arcade-v3-${difficulty}-${mode}${isTimedRecord() ? '' : '-untimed'}`;
  function readBest() {
    best = null;
    try { const value = Number(localStorage.getItem(key())); if (value > 0 && Number.isFinite(value)) best = value; } catch { /* Optional storage. */ }
  }
  root.innerHTML = `<div class="ag-shell ag-arcade-shell">
    <div class="ag-titlebar"><span><i aria-hidden="true"></i> 用户协议确认程序 · 街机版</span><span>版本 3.1 / 简体中文</span></div>
    <div class="ag-toolbar"><span class="ag-state" data-ag-state>等待确认</span><div class="ag-stats"><span>总计 <b data-ag-time>00:00.0</b></span><span>失误 <b data-ag-errors>0</b></span><button type="button" data-ag-sound aria-pressed="false">音效：关</button><button type="button" data-ag-limit role="switch" aria-checked="true">时间限制：开</button><button type="button" data-ag-pause hidden>暂停</button></div></div>
    <div class="ag-progress" aria-label="协议确认进度"></div><div class="ag-body" data-ag-body></div>
    <div class="ag-bottom"><span data-ag-mode></span><span>本机最佳 <b data-ag-best>等待你的纪录</b></span></div>
    <div class="ag-overlay" data-ag-overlay hidden></div></div>`;
  const $ = s => root.querySelector(s), body = $('[data-ag-body]'), overlay = $('[data-ag-overlay]');
  function beep(kind = 'click') {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = kind === 'fail' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(kind === 'fail' ? 180 : kind === 'win' ? 580 : 380, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(kind === 'fail' ? 70 : 880, audio.currentTime + .15);
      gain.gain.setValueAtTime(.045, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .18);
      osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .2);
    } catch { /* Sound must never block a game. */ }
  }
  function stats() {
    $('[data-ag-time]').textContent = time(elapsed); $('[data-ag-errors]').textContent = errors;
    $('[data-ag-best]').textContent = best ? time(best) : '等待你的纪录';
    const limitLabel = timeLimited ? (!isTimedRecord() && !practice ? '限时已开启 · 本局按不限时记录' : '限时') : '不限时';
    $('[data-ag-mode]').textContent = `${DIFFICULTIES[difficulty].label}难度 · ${limitLabel} · ${practice ? '单关练习 · 不计入纪录' : mode === 'classic' ? '经典模式 · 一次失误全部重来' : '休闲模式 · 重试本条，罚时 5 秒'}`;
    $('[data-ag-limit]').textContent = `时间限制：${timeLimited ? '开' : '关'}`;
    $('[data-ag-limit]').setAttribute('aria-checked', String(timeLimited));
    renderCountdown();
    $('[data-ag-state]').textContent = state === 'intro' ? '等待确认' : state === 'won' ? '挑战完成' : index === 12 && !practice ? '协议已通过 · 正式游戏' : `${practice ? '练习' : '正在确认'} · 第 ${String(index + 1).padStart(2, '0')} 条`;
    $('.ag-progress').innerHTML = Array.from({ length: 12 }, (_, i) => `<span class="${!practice && (state === 'won' || i < index) ? 'done' : state !== 'intro' && i === index ? 'current' : ''}" aria-label="第 ${i + 1} 条">${String(i + 1).padStart(2, '0')}</span>`).join('');
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function renderCountdown() {
    const countdown = $('[data-ag-countdown]');
    if (!countdown) return;
    countdown.textContent = timeLimited ? `${Math.max(0, Math.ceil(remaining / 1000))} 秒` : '不限时';
    countdown.classList.toggle('urgent', timeLimited && remaining < 10000);
    countdown.classList.toggle('unlimited', !timeLimited);
  }
  function settle() { if (state === 'playing' && last) { const now = performance.now(), dt = now - last; elapsed += dt; if (timeLimited) remaining -= dt; last = now; } }
  function setTimeLimit(value) {
    if (value === timeLimited) return;
    settle(); timeLimited = value;
    if (state !== 'intro' && state !== 'won' && !value) runTimed = false;
    try { localStorage.setItem('landou-agreement-time-limit', String(value)); } catch { /* Optional storage. */ }
    readBest(); stats();
  }
  function tick(now) {
    if (state !== 'playing' || !visible || document.hidden) { stop(); return; }
    const dt = last ? now - last : 0; last = now; elapsed += dt; if (timeLimited) remaining -= dt;
    $('[data-ag-time]').textContent = time(elapsed);
    renderCountdown();
    if (timeLimited && remaining <= 0) return fail('确认超时。协议不会一直等你。');
    engine?.update(Math.min(dt, 40) / 1000);
    if (state === 'playing') raf = requestAnimationFrame(tick);
  }
  function run() { stop(); last = performance.now(); raf = requestAnimationFrame(tick); }
  function modal(title, message, buttons, symbol = 'Ⅱ') {
    overlay.innerHTML = `<div class="ag-pause-card" role="dialog" aria-modal="true" aria-labelledby="ag-dialog-title"><span class="ag-symbol" aria-hidden="true">${symbol}</span><h2 id="ag-dialog-title">${title}</h2><p>${message}</p>${buttons.map(([label, action], i) => `<button class="ag-button ${i ? '' : 'ag-primary'}" type="button" data-modal-action="${action}">${label}</button>`).join('')}</div>`;
    overlay.hidden = false; body.inert = true; $('[data-ag-pause]').disabled = true;
    if (visible && !document.hidden) overlay.querySelector('button').focus({ preventScroll: true });
  }
  function hideModal() { overlay.hidden = true; body.inert = false; $('[data-ag-pause]').disabled = false; }
  function pause() {
    if (state !== 'playing') return;
    settle(); state = 'paused'; stop(); engine?.suspend(); stats();
    modal('暂停一下。', '计时和场景都已暂停，准备好后再继续。', [['继续挑战 →', 'resume'], [timeLimited ? '关闭时间限制' : '开启时间限制', 'limit'], ['返回游戏大厅', 'home']]);
  }
  function fail(reason) {
    if (state !== 'playing') return;
    settle(); errors++; if (mode === 'casual' || practice) elapsed += 5000;
    state = 'failed'; stop(); engine?.suspend(); beep('fail'); stats();
    modal('不同意！', `${reason}<br>${mode === 'classic' && !practice ? '经典模式：本轮协议全部作废，从第 1 条重来。' : '本条协议作废，罚时 +5 秒。再来一次！'}`, [[mode === 'classic' && !practice ? '重新挑战 12 条 →' : '重试本条 →', 'retry'], ['返回游戏大厅', 'home']], '×');
  }
  function win() {
    if (state !== 'playing') return;
    settle(); state = 'cleared'; stop(); engine?.suspend(); beep('win');
    if (practice || index === 12) return finish();
    modal('同意！', index === 11 ? '12 条协议全部确认。现在，终于可以开始真正的游戏了。' : `第 ${index + 1} 条已通过。别高兴太早，下一条还在等你。`, [[index === 11 ? '进入心跳跑酷 →' : '下一条协议 →', 'next']], '✓');
  }
  function begin(isPractice = false, id = '') {
    practice = isPractice; elapsed = 0; errors = 0; index = 0;
    runTimed = timeLimited;
    order = isPractice ? [id] : ['tutorial', ...shuffle(['chase', 'popups', 'whack']), ...shuffle(['catch', 'roulette', 'slots', 'memory']), ...shuffle(['breakout', 'flappy', 'mash', 'dodge']), 'runner'];
    readBest(); loadLevel();
  }
  function loadLevel() {
    stop(); engine?.dispose(); hideModal(); state = 'ready';
    const entry = challengeCopy(CHALLENGES.find(c => c.id === order[index]), difficulty); remaining = entry.time * 1000;
    $('[data-ag-pause]').hidden = false; stats();
    body.innerHTML = `<div class="ag-level-head"><span class="ag-kicker">${entry.id === 'runner' ? '真正的游戏 / 心跳跑酷' : '服务条款 / ' + entry.category}</span><span class="ag-countdown" data-ag-countdown></span></div><h2 class="ag-level-title" tabindex="-1" data-ag-heading>${entry.title}</h2><p class="ag-instruction">${entry.description}</p><div class="ag-arcade" data-ag-arena tabindex="0" aria-label="${entry.title}游戏区域"></div><p class="ag-feedback" data-ag-feedback role="status">${entry.controls}</p><div class="ag-level-footer"><details><summary>卡住了？查看提示</summary><p>${entry.hint}</p></details><button class="ag-text-button" data-ag-forfeit type="button">放弃本条</button></div>`;
    renderCountdown();
    engine = createChallenge(entry.id, { area: $('[data-ag-arena]'), difficulty, active: () => state === 'playing', win, fail, beep, status: message => { const el = $('[data-ag-feedback]'); if (el) el.textContent = message; } });
    const ready = document.createElement('div'); ready.className = 'ag-ready';
    ready.innerHTML = `<span>${DIFFICULTIES[difficulty].label}难度 / ${entry.category}</span><strong>${entry.title}</strong><p>${entry.controls}</p><button type="button" class="ag-button ag-primary" data-ag-launch>准备好了，开始 →</button>`;
    $('[data-ag-arena]').append(ready);
    $('[data-ag-launch]').addEventListener('click', () => { ready.remove(); state = 'playing'; beep(); $('[data-ag-arena]').focus({ preventScroll: true }); run(); }, { once: true });
    $('[data-ag-forfeit]').addEventListener('click', () => { if (state === 'ready') state = 'playing'; fail('你放弃了这条协议。'); });
    $('[data-ag-heading]').focus({ preventScroll: true });
  }
  function finish() {
    state = 'won'; stop(); engine?.dispose(); hideModal(); $('[data-ag-pause]').hidden = true;
    let record = false, stored = true;
    if (!practice && (best === null || elapsed < best)) { best = elapsed; record = true; try { localStorage.setItem(key(), String(best)); } catch { stored = false; } }
    stats();
    const resultLabel = isTimedRecord() ? '限时纪录' : '不限时纪录';
    body.innerHTML = `<div class="ag-result"><span class="ag-seal" aria-hidden="true">✓</span><span class="ag-kicker">${practice ? '单关练习完成' : '12 条协议 + 心跳跑酷 · 全部通过'}</span><h2 data-ag-heading tabindex="-1">${practice ? '这一关，拿下了。' : '现在，你可以<br>关掉这个游戏了。'}</h2><p>${practice ? '再试试别的机关，或者来一轮完整挑战。' : '你战胜的不只是协议，还有忍不住乱点的自己。'}</p><div class="ag-result-stats"><div><span>总用时（含罚时）</span><strong>${time(elapsed)}</strong></div><div><span>失误次数</span><strong>${errors}<small> 次</small></strong></div></div><p class="ag-record">${practice ? '练习成绩不计入纪录' : record ? '✦ 刷新本机纪录！' : '本机最佳：' + time(best)}${stored ? '' : '（浏览器未允许保存）'}</p><button type="button" class="ag-button ag-primary" data-ag-again>再来一局 →</button> <button type="button" class="ag-button" data-ag-home>返回大厅</button></div>`;
    $('[data-ag-again]').addEventListener('click', () => begin(practice, order[0])); $('[data-ag-home]').addEventListener('click', intro);
    if (!practice) $('.ag-record').append(` · ${resultLabel}`);
    $('[data-ag-heading]').focus({ preventScroll: true });
  }
  function intro() {
    stop(); engine?.dispose(); engine = null; hideModal(); state = 'intro'; practice = false; index = 0; elapsed = 0; errors = 0;
    $('[data-ag-pause]').hidden = true; readBest(); stats();
    body.innerHTML = `<div class="ag-intro"><div class="ag-intro-copy"><span class="ag-kicker">协议已升级，耐心请充值。</span><h2>我只是想<br><span>点个同意！</span></h2><p>会逃跑的按钮、真假弹窗、弹幕和打砖块。<br>闯过 12 条随机排列的协议，才能开始真正的游戏。</p><div class="ag-mode-picker" role="group" aria-label="游戏模式"><button type="button" data-mode="casual" aria-pressed="${mode === 'casual'}">休闲模式<small>失败重试当前关</small></button><button type="button" data-mode="classic" aria-pressed="${mode === 'classic'}">经典模式<small>失误一次，全部重来</small></button></div><button class="ag-button ag-primary" type="button" data-ag-start>开始挑战 <span aria-hidden="true">→</span></button><small>12 种协议机关 + 最终跑酷 · 每局顺序和布局变化</small></div><div class="ag-preview ag-arcade-preview" aria-hidden="true"><div class="ag-paper"><div class="ag-paper-top">用户协议.exe <span>×</span></div><div class="ag-paper-content"><span class="ag-paper-number">请不要相信肌肉记忆</span><h3>你以为<br>这就结束了？</h3><div class="ag-preview-bricks"><i></i><i></i><i></i><i></i><i></i><i></i><b>●</b><span></span></div><div class="ag-fake-button">同意 <b>↖</b></div></div></div><span class="ag-sticker">不同意！<br>请重试。</span></div></div><div class="ag-rules"><div><b>01</b><span><strong>协议变成小游戏</strong><small>每一关都换一种操作方式</small></span></div><div><b>02</b><span><strong>绿色也可能是陷阱</strong><small>看文字、看时机，别一直连点</small></span></div><div><b>03</b><span><strong>12 条之后还有惊喜</strong><small>最后解锁真正的心跳跑酷</small></span></div></div><details class="ag-practice"><summary>单关练习室 <span>13 个小游戏随时玩</span></summary><div>${CHALLENGES.map((entry, i) => `<button type="button" data-practice="${entry.id}"><b>${String(i + 1).padStart(2, '0')}</b>${entry.title}</button>`).join('')}</div></details>`;
    const picker = document.createElement('div');
    picker.className = 'ag-difficulty-picker'; picker.setAttribute('role', 'group'); picker.setAttribute('aria-label', '游戏难度');
    picker.innerHTML = `<span>先选难度</span><div>${Object.entries(DIFFICULTIES).map(([id, entry]) => `<button type="button" data-ag-difficulty="${id}" aria-pressed="${difficulty === id}"><strong>${entry.label}</strong><small>${entry.summary}</small></button>`).join('')}</div>`;
    $('.ag-mode-picker').before(picker);
    body.querySelectorAll('[data-ag-difficulty]').forEach(button => button.addEventListener('click', () => {
      difficulty = button.dataset.agDifficulty;
      body.querySelectorAll('[data-ag-difficulty]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      try { localStorage.setItem('landou-agreement-difficulty', difficulty); } catch { /* Optional storage. */ }
      readBest(); stats();
    }));
    $('[data-ag-start]').addEventListener('click', () => begin());
    body.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; body.querySelectorAll('[data-mode]').forEach(el => el.setAttribute('aria-pressed', String(el === button))); readBest(); stats(); }));
    body.querySelectorAll('[data-practice]').forEach(button => button.addEventListener('click', () => begin(true, button.dataset.practice)));
  }
  overlay.addEventListener('click', event => {
    const action = event.target.closest('[data-modal-action]')?.dataset.modalAction;
    if (action === 'resume' && visible && !document.hidden) { hideModal(); state = 'playing'; $('[data-ag-arena]').focus({ preventScroll: true }); run(); }
    if (action === 'home') intro();
    if (action === 'limit' && state === 'paused') { setTimeLimit(!timeLimited); overlay.querySelector('[data-modal-action="limit"]').textContent = timeLimited ? '关闭时间限制' : '开启时间限制'; }
    if (action === 'next') { index++; loadLevel(); }
    if (action === 'retry') { if (mode === 'classic' && !practice) begin(); else loadLevel(); }
  });
  $('[data-ag-sound]').addEventListener('click', event => { sound = !sound; event.target.textContent = `音效：${sound ? '开' : '关'}`; event.target.setAttribute('aria-pressed', String(sound)); beep(); });
  $('[data-ag-pause]').addEventListener('click', pause);
  $('[data-ag-limit]').addEventListener('click', () => setTimeLimit(!timeLimited));
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') pause();
    if (event.key === 'Tab' && !overlay.hidden) { const buttons = [...overlay.querySelectorAll('button')], first = buttons[0], end = buttons.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); end.focus(); } if (!event.shiftKey && document.activeElement === end) { event.preventDefault(); first.focus(); } }
  });
  window.addEventListener('blur', pause); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  intro();
  return { setVisible(value) { visible = value; if (!value) pause(); } };
}
