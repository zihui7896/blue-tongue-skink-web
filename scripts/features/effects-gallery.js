import{BloomingFlowerEffect}from"../effects/blooming-flower/BloomingFlowerEffect.js";
import{BloomingRoseEffect}from"../effects/blooming-rose/BloomingRoseEffect.js";

export function initEffectsGallery(){
  const effects=new Map([
    ["blooming-flower",new BloomingFlowerEffect(document.querySelector("#blooming-flower"))],
    ["blooming-rose",new BloomingRoseEffect(document.querySelector("#blooming-rose"))]
  ]);
  document.querySelectorAll("[data-effect-speed]").forEach(select=>select.addEventListener("change",()=>effects.get(select.dataset.effectSpeed)?.setSpeed(select.value)));
  document.querySelectorAll("[data-replay-effect]").forEach(button=>button.addEventListener("click",()=>{
    effects.get(button.dataset.replayEffect)?.replay();button.textContent="正在盛开…";setTimeout(()=>button.textContent="重新盛开",1200);
  }));
  const directoryButtons=[...document.querySelectorAll("[data-effect-target]")],cards=[...document.querySelectorAll(".effect-card[id]")];
  const setActive=id=>directoryButtons.forEach(button=>{const active=button.dataset.effectTarget===id;button.classList.toggle("active",active);button.setAttribute("aria-current",active?"true":"false")});
  directoryButtons.forEach(button=>button.addEventListener("click",()=>{document.getElementById(button.dataset.effectTarget)?.scrollIntoView({behavior:"smooth",block:"start"});setActive(button.dataset.effectTarget)}));
  const observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)setActive(visible.target.id)},{rootMargin:"-18% 0px -52%",threshold:[.1,.3,.55]});
  cards.forEach(card=>observer.observe(card));
  return{setVisible:visible=>effects.forEach(effect=>effect.setVisible(visible)),replay:()=>effects.forEach(effect=>effect.replay())};
}
