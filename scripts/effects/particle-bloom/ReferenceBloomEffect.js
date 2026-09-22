// Original reference footage: keep its rendered depth, lighting and petal motion.
export class ReferenceBloomEffect {
  constructor(card) {
    this.card = card;
    this.video = card.querySelector('video');
    this.slider = card.querySelector('[data-bloom-progress]');
    this.output = card.querySelector('[data-bloom-time]');
    this.phase = card.querySelector('[data-bloom-phase]');
    this.toggle = card.querySelector('[data-bloom-toggle]');
    this.steps = [...card.querySelectorAll('[data-bloom-step]')];
    this.visible = false;
    this.inViewport = false;
    this.userPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ready = false;
    this.loadingSource = true;
    this.video.muted = true;
    const ready = () => {
      if (this.loadingSource || !Number.isFinite(this.video.duration) || this.video.duration <= 0) return;
      this.ready = true;
      this.video.controls = false;
      card.querySelectorAll('button,input,select').forEach(control => control.disabled = false);
      this.update();
      this.sync();
    };
    this.video.addEventListener('loadedmetadata', ready);
    for (const event of ['timeupdate', 'seeked', 'play', 'pause']) {
      this.video.addEventListener(event, () => this.update());
    }
    this.video.addEventListener('ended', () => { this.userPaused = true; this.update(); });
    this.video.addEventListener('error', () => {
      this.ready = false;
      this.phase.textContent = '视频暂时无法加载，请刷新重试';
      this.video.controls = true;
    });
    this.toggle.addEventListener('click', () => {
      if (this.video.ended) { this.replay(); return; }
      this.userPaused = !this.userPaused;
      this.sync();
    });
    card.querySelector('[data-bloom-replay]').addEventListener('click', () => this.replay());
    card.querySelector('[data-bloom-speed]').addEventListener('change', event => {
      this.video.playbackRate = Number(event.target.value);
    });
    this.slider.addEventListener('input', () => this.seek(Number(this.slider.value) / 100));
    this.steps.forEach(button => button.addEventListener('click', () => this.seek(Number(button.dataset.bloomStep))));
    this.observer = new IntersectionObserver(entries => {
      this.inViewport = entries[0].isIntersecting;
      this.sync();
    }, { threshold: .05 });
    this.observer.observe(this.video);
    document.addEventListener('visibilitychange', () => this.sync());
    // A small local Blob supports seeking even on static servers without Range.
    fetch(this.video.src).then(response => {
      if (!response.ok) throw new Error('Video request failed');
      return response.blob();
    }).then(blob => {
      this.loadingSource = false;
      this.video.src = URL.createObjectURL(blob);
      this.video.load();
    }).catch(() => {
      // Native playback remains available for direct file:// previews.
      this.loadingSource = false;
      ready();
    });
  }
  update() {
    if (!this.ready) return;
    const progress = this.video.currentTime / this.video.duration;
    this.slider.value = String(progress * 100);
    this.output.textContent = `${this.video.currentTime.toFixed(1)} / ${this.video.duration.toFixed(1)} s`;
    const names = ['初见 · 薄纱花瓣', '舒展 · 光影流动', '靠近 · 层层花心', '细节 · 花瓣纹理', '定格 · 留住这一刻'];
    const thresholds = [0, .25, .48, .76, .98];
    const stage = thresholds.reduce((active, threshold, index) => progress + .0001 >= threshold ? index : active, 0);
    this.phase.textContent = names[stage];
    this.slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)}%，${names[stage]}`);
    this.steps.forEach((button, index) => {
      button.classList.toggle('active', index === stage);
      button.setAttribute('aria-pressed', String(index === stage));
    });
    this.toggle.textContent = this.video.paused ? '继续播放' : '暂停';
    this.toggle.setAttribute('aria-pressed', String(this.video.paused));
  }
  seek(progress) {
    if (!this.ready) return;
    this.userPaused = true;
    this.video.pause();
    // Stay on the final decoded frame rather than the empty end of the stream.
    this.video.currentTime = Math.min(Math.max(0, progress) * this.video.duration, this.video.duration - 1 / 30);
    this.update();
  }
  replay() {
    if (!this.ready) return;
    this.video.currentTime = 0;
    this.userPaused = false;
    this.sync();
  }
  setVisible(visible) { this.visible = visible; this.sync(); }
  sync() {
    if (!this.ready) return;
    if (!this.visible || !this.inViewport || document.hidden || this.userPaused) {
      this.video.pause();
      this.update();
      return;
    }
    this.video.play().catch(error => {
      if (error.name === 'AbortError') return;
      this.userPaused = true;
      this.update();
      this.phase.textContent = '点击继续播放，看看花瓣的光影';
    });
  }
}
