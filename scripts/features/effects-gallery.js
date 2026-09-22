export function initEffectsGallery() {
  const cards = [...document.querySelectorAll('.particle-bloom-card')];
  const effects = new Map(), loading = new Map(), onScreen = new Set();
  let visible = false;
  async function ensure(card) {
    if (!visible || !onScreen.has(card)) return;
    if (effects.has(card)) { effects.get(card).setVisible(true); return; }
    if (loading.has(card)) return;
    const isReference = card.hasAttribute('data-bloom-video');
    const module = isReference
      ? import('../effects/particle-bloom/ReferenceBloomEffect.js?v=reference-8')
      : import('../effects/particle-bloom/ParticleBloomEffect.js?v=flowers-19');
    const task = module.then(exports => {
      const Effect = isReference ? exports.ReferenceBloomEffect : exports.ParticleBloomEffect;
      const effect = new Effect(card);
      effects.set(card,effect); effect.setVisible(visible);
      if (!isReference) card.querySelectorAll('button,input,select').forEach(control=>control.disabled=false);
    }).catch(error => {
      card.querySelector('[data-bloom-phase]').textContent=isReference?'请使用画面内的视频控件播放。':'3D 场景暂时无法启动，请启用硬件加速后刷新。';
      console.error('Flower initialization failed',error);
    });
    loading.set(card,task);
  }
  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry=>{if(entry.isIntersecting){onScreen.add(entry.target);ensure(entry.target);}else onScreen.delete(entry.target);});
  },{rootMargin:'120px',threshold:0});
  cards.forEach(card=>visibilityObserver.observe(card));
  const buttons=[...document.querySelectorAll('[data-effect-target]')];
  function setActive(id){buttons.forEach(button=>{const active=button.dataset.effectTarget===id;button.classList.toggle('active',active);button.setAttribute('aria-current',String(active));});}
  buttons.forEach(button=>button.addEventListener('click',()=>{document.getElementById(button.dataset.effectTarget)?.scrollIntoView({behavior:'smooth',block:'start'});setActive(button.dataset.effectTarget);}));
  const directoryObserver=new IntersectionObserver(entries=>{const current=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(current)setActive(current.target.id);},{rootMargin:'-15% 0px -45%',threshold:[.01,.2,.5]});
  cards.forEach(card=>directoryObserver.observe(card));
  return {setVisible(value){visible=value;effects.forEach(effect=>effect.setVisible(value));if(value)onScreen.forEach(ensure);},replay(){effects.forEach(effect=>effect.replay());}};
}
