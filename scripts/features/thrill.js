const COPY = {
  coaster: ['在最高点，停留一秒。', '钢轨延伸到天空尽头，然后从脚下消失。'],
  bridge: ['脚下，是一整座深谷。', '走上透明桥面，低头，纵身跃入山间云雾。'],
  scare: ['这里，看起来很安静。', '阳光穿过树林。沿着小路，慢慢向前。']
};

export function initThrill() {
  const root = document.querySelector('#view-thrill');
  if (!root) return { setVisible() {} };
  const find = name => root.querySelector(`[data-thrill-${name}]`);
  const canvas = find('canvas'), cinema = find('cinema');
  let engine, loading, visible = false, mode = 'coaster', running = false;
  let elapsed = 0, frame = 0, last = 0, sound = false, audio;
  let scareAt = 10, pointer, yaw = 0, pitch = 0;
  const duration = () => mode === 'scare' ? scareAt + 3 : mode === 'bridge' ? 19 : 24;
  const status = message => { find('status').textContent = message; };

  function audioLevel(level, fright = false) {
    if (!audio) return;
    audio.gain.gain.setTargetAtTime(sound && running && visible ? level : 0, audio.ctx.currentTime, .08);
    audio.filter.frequency.setTargetAtTime(fright ? 2200 : 180 + level * 5000, audio.ctx.currentTime, .1);
  }
  async function prepareAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { status('此浏览器不支持音效，仍可观看画面。'); return; }
    if (!audio) {
      const ctx = new Audio(), buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < data.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .06) / 1.02; data[i] = previous * 3; }
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; filter.type = 'lowpass'; gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(ctx.destination); source.start();
      audio = { ctx, filter, gain, source };
    }
    await audio.ctx.resume();
  }
  function render() {
    if (!engine || !visible) return;
    const state = engine.render(mode, elapsed, { yaw, pitch, scareAt });
    find('phase').textContent = running ? state.phase : elapsed ? '已暂停' : '准备进入';
    find('time').textContent = `00:${String(Math.floor(elapsed)).padStart(2, '0')}`;
    find('progress').value = elapsed / duration();
    audioLevel(state.volume, state.fright);
  }
  function pause() {
    running = false; cancelAnimationFrame(frame); frame = 0;
    find('pause').textContent = '继续'; audioLevel(0); render();
  }
  function tick(now) {
    if (!running || !visible || document.hidden) return;
    elapsed += Math.min((now - last) / 1000, .05); last = now;
    if (elapsed >= duration()) {
      elapsed = duration(); pause();
      find('intro').hidden = false; find('title').textContent = '心跳，慢慢回到原位。';
      find('description').textContent = '这一程结束了。可以再来一次，或切换另一个场景。';
      find('start').textContent = '再体验一次 ↗'; find('pause').disabled = true;
      find('phase').textContent = '体验结束'; return;
    }
    render(); frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!engine || !visible || document.hidden) return;
    running = true; find('intro').hidden = true; find('pause').disabled = false;
    find('pause').textContent = '暂停'; last = performance.now();
    cancelAnimationFrame(frame); frame = requestAnimationFrame(tick);
  }
  function reset() {
    pause(); elapsed = 0; yaw = 0; pitch = 0; scareAt = 9 + Math.random() * 5;
    find('intro').hidden = false; find('title').textContent = COPY[mode][0];
    find('description').textContent = COPY[mode][1]; find('start').textContent = '开始体验 ↗';
    find('pause').disabled = true; render();
  }
  async function ensureEngine() {
    if (engine) return engine;
    if (!loading) {
      find('start').disabled = true;
      loading = import('../effects/thrill-world.js?v=1').then(({ ThrillWorld }) => {
        engine = new ThrillWorld(canvas); engine.select(mode); render(); return engine;
      }).catch(error => {
        status('无法启动 3D 场景，请开启浏览器硬件加速并刷新重试。');
        find('description').textContent = '3D 场景加载失败，请刷新后重试。';
        console.error('Thrill scene unavailable', error); return null;
      }).finally(() => { find('start').disabled = !engine; });
    }
    return loading;
  }
  root.querySelectorAll('[data-thrill-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.thrillMode;
    root.querySelectorAll('[data-thrill-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    reset();
  }));
  find('start').addEventListener('click', async () => {
    if (sound) prepareAudio().catch(() => status('声音未能启动，可以关闭声音继续观看。'));
    if (!await ensureEngine() || !visible) return;
    elapsed = 0; yaw = 0; pitch = 0; scareAt = 9 + Math.random() * 5; resume(); canvas.focus();
  });
  find('pause').addEventListener('click', () => running ? pause() : resume());
  find('reset').addEventListener('click', reset);
  find('stop').addEventListener('click', () => { reset(); if (document.fullscreenElement === cinema) document.exitFullscreen().catch(() => {}); });
  find('sound').addEventListener('click', async () => {
    sound = !sound; find('sound').textContent = `声音：${sound ? '开' : '关'}`;
    find('sound').setAttribute('aria-pressed', String(sound));
    if (sound) { try { await prepareAudio(); } catch { sound = false; find('sound').textContent = '声音：关'; find('sound').setAttribute('aria-pressed', 'false'); status('音效未能启动，请稍后重试。'); } }
    else audioLevel(0);
  });
  find('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement === cinema) await document.exitFullscreen(); else await cinema.requestFullscreen(); }
    catch { status('当前浏览器不支持全屏，请使用浏览器的全屏功能。'); }
  });
  document.addEventListener('fullscreenchange', () => { find('fullscreen').textContent = document.fullscreenElement === cinema ? '退出全屏 ↙' : '全屏 ↗'; engine?.resize(); render(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('keydown', event => { if (visible && event.key === 'Escape') reset(); });
  canvas.addEventListener('keydown', event => {
    if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    if (event.key === ' ' && elapsed > 0 && elapsed < duration()) running ? pause() : resume();
    if (event.key === 'ArrowLeft') yaw += .08;
    if (event.key === 'ArrowRight') yaw -= .08;
    if (event.key === 'ArrowUp') pitch += .08;
    if (event.key === 'ArrowDown') pitch -= .08;
    yaw = Math.max(-.65, Math.min(.65, yaw)); pitch = Math.max(-.5, Math.min(.5, pitch)); render();
  });
  canvas.addEventListener('pointerdown', event => { pointer = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => {
    if (!pointer) return;
    yaw = Math.max(-.65, Math.min(.65, yaw - (event.clientX - pointer.x) * .003));
    pitch = Math.max(-.5, Math.min(.5, pitch - (event.clientY - pointer.y) * .003));
    pointer = { x: event.clientX, y: event.clientY }; render();
  });
  canvas.addEventListener('pointerup', () => { pointer = null; });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); pause(); status('画面连接已中断，请刷新页面重新进入。'); find('start').disabled = true; find('pause').disabled = true; });
  new ResizeObserver(() => { engine?.resize(); render(); }).observe(cinema);
  return { setVisible(value) { visible = value; if (value) ensureEngine().then(() => { engine?.resize(); render(); }); else reset(); } };
}
