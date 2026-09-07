import * as THREE from '../../vendor/three.module.js';
import { DURATION, clamp01, smooth, stageFor } from './geometry.js?v=flowers-3';
import { makeVeilPetals } from './VeilPetals.js?v=flowers-3';

export class ParticleBloomEffect {
  constructor(card) {
    this.card = card;
    this.kind = card.dataset.flower || 'lotus';
    this.canvas = card.querySelector('canvas');
    this.slider = card.querySelector('[data-bloom-progress]');
    this.output = card.querySelector('[data-bloom-time]');
    this.phase = card.querySelector('[data-bloom-phase]');
    this.toggle = card.querySelector('[data-bloom-toggle]');
    this.elapsed = 0; this.speed = 1; this.visible = false; this.inViewport = false; this.raf = 0;
    this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
    this.renderer.setClearColor(0x080b17, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
    this.camera.position.set(0, 3.8, 8.5); this.camera.lookAt(0, .1, 0);
    this.flower = new THREE.Group(); this.flower.rotation.y = -.3; this.flower.rotation.z = -.16; this.scene.add(this.flower);
    this.uniforms = { progress: { value: 0 }, pixelRatio: { value: this.renderer.getPixelRatio() } };
    this.petals = makeVeilPetals(this.uniforms.progress, this.kind);
    this.flower.add(this.petals);
    this.makeStem();
    const heart = [], heartColors = [];
    for (let i = 0; i < 850; i++) {
      const a = i * 2.399963, r = Math.sqrt(i / 850) * .3;
      heart.push(Math.cos(a) * r, .25 + .19 * Math.sin(i * 1.7) ** 2, Math.sin(a) * r);
      heartColors.push(.92, .74, .71);
    }
    this.heart = this.makePoints(heart, heartColors, .012); this.flower.add(this.heart);
    const pollen = [], pollenColors = [];
    for (let i = 0; i < 50; i++) { const a = i * 2.4; const r = .7 + ((i * 37) % 101) / 101 * 3.3; pollen.push(Math.cos(a) * r, (i % 39) / 39 * 5 - 2, Math.sin(a) * r); pollenColors.push(.65, .43, .54); }
    this.pollen = this.makePoints(pollen, pollenColors, .009); this.scene.add(this.pollen);
    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.canvas);
    this.intersectionObserver = new IntersectionObserver(entries => { this.inViewport = entries[0].isIntersecting; this.sync(); }, { threshold: .02 }); this.intersectionObserver.observe(this.canvas);
    document.addEventListener('visibilitychange', () => this.sync());
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.failed = true; this.sync(); this.phase.textContent = '3D 场景已中断，请刷新页面恢复'; });
    this.resize(); this.update();
  }
  makePoints(positions, colors, size) {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Points(geometry, material);
  }
  makeStem() {
    const positions = [], colors = [];
    for (let i = 0; i < 1300; i++) {
      const t = i / 1300, a = i * 2.4;
      positions.push(Math.sin(t * 3) * .13 + Math.cos(a) * .033, -2.35 * t, Math.sin(a) * .033);
      colors.push(.65, .49, .55);
    }
    this.flower.add(this.makePoints(positions, colors, .014));
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect(); if (!width || !height) return;
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height;
    this.camera.position.set(0, 3.8, width < 520 ? 8.8 : 7.5); this.camera.lookAt(0, .1, 0); this.camera.updateProjectionMatrix(); this.render();
  }
  bindControls() {
    this.toggle.addEventListener('click', () => { if (this.elapsed >= DURATION) this.elapsed = 0; this.paused = !this.paused; this.update(); this.sync(); });
    this.card.querySelector('[data-bloom-replay]').addEventListener('click', () => this.replay());
    this.card.querySelector('[data-bloom-speed]').addEventListener('change', e => { this.speed = Number(e.target.value); });
    this.slider.addEventListener('input', () => { this.elapsed = Number(this.slider.value) / 100 * DURATION; this.paused = true; this.update(); this.sync(); });
    this.card.querySelectorAll('[data-bloom-step]').forEach(button => button.addEventListener('click', () => { this.elapsed = Number(button.dataset.bloomStep) * DURATION; this.paused = true; this.update(); this.sync(); }));
    let drag;
    this.canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, rotation: this.flower.rotation.y }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', e => { if (!drag) return; this.flower.rotation.y = drag.rotation + (e.clientX - drag.x) * .008; this.render(); });
    for (const event of ['pointerup', 'pointercancel']) this.canvas.addEventListener(event, () => { drag = null; });
    this.canvas.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); this.flower.rotation.y += e.key === 'ArrowLeft' ? -.12 : .12; this.render(); } });
  }
  update() {
    const progress = clamp01(this.elapsed / DURATION); this.uniforms.progress.value = progress;
    this.heart.scale.setScalar(.02 + smooth((progress - .58) / .28) * .98);
    this.heart.material.opacity = this.kind === 'rose' ? 0 : smooth((progress - .58) / .28) * .5;
    this.pollen.rotation.y = this.elapsed * .015; this.petals.rotation.y = Math.sin(progress * Math.PI) * .10;
    if (!this.lastUiTime || Math.abs(this.elapsed-this.lastUiTime) >= .1 || this.paused || this.elapsed === 0) {
    this.lastUiTime=this.elapsed;
    this.slider.value = String(Math.round(progress * 100)); this.output.textContent = `${this.elapsed.toFixed(1)} / ${DURATION.toFixed(1)} s`;
    const stage = stageFor(progress), names = ['含苞 · 花瓣紧紧相拥', '初绽 · 外层花瓣向外翻开', '舒展 · 中层花瓣依次松开', '绽放 · 内瓣打开，花心层次显露', '盛放 · 把这一刻留久一点'];
    this.phase.textContent = names[stage]; this.slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)}%，${names[stage]}`);
    this.card.querySelectorAll('[data-bloom-step]').forEach((button, i) => { button.classList.toggle('active', i === stage); button.setAttribute('aria-pressed', String(i === stage)); });
    this.toggle.textContent = this.paused ? '继续盛开' : '暂停'; this.toggle.setAttribute('aria-pressed', String(this.paused));
    }
    this.render();
  }
  render() { if (!this.failed) this.renderer.render(this.scene, this.camera); }
  replay() { this.elapsed = 0; this.paused = false; this.update(); this.sync(); }
  setVisible(visible) { this.visible = visible; this.sync(); }
  sync() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.failed || !this.visible || !this.inViewport || document.hidden || this.paused) return;
    this.last = performance.now(); this.raf = requestAnimationFrame(now => this.frame(now));
  }
  frame(now) {
    this.raf = 0; this.elapsed = Math.min(DURATION, this.elapsed + Math.min((now - this.last) / 1000, .08) * this.speed); this.last = now;
    if (this.elapsed === DURATION) this.paused = true;
    this.update(); if (!this.paused) this.raf = requestAnimationFrame(next => this.frame(next));
  }
}
