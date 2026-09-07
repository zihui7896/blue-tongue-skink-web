import { initSurprise } from "./features/surprise.js?v=gift-1";
import{initSidebar}from"./components/sidebar.js";import{initPetPlayground}from"./features/pet-playground.js";import{initEffectsGallery}from"./features/effects-gallery.js?v=flowers-3";import{CAT_STATES}from"./data/pet-states.js?v=cat-states-1";
initPetPlayground();
initPetPlayground({rootSelector:'[data-pet-playground="cat"]',states:CAT_STATES,petName:"橘团",dialogText:"喵呜",spritePath:"ju-tuan-cat/spritesheet.webp"});
const effects=initEffectsGallery();
const surprise=initSurprise();
let thrill, thrillLoading, currentView;
function showThrill(visible) {
  if(thrill){thrill.setVisible(visible);return;}
  if(!visible || thrillLoading)return;
  thrillLoading=import('./features/thrill.js?v=1').then(({initThrill})=>{
    thrill=initThrill();
    thrill.setVisible(currentView==='thrill');
  }).catch(error=>{
    const status=document.querySelector('[data-thrill-status]');
    if(status)status.textContent='这个栏目的场景文件暂未就绪，请稍后重试。其他栏目可以正常使用。';
    console.error('Thrill feature could not be loaded',error);
  }).finally(()=>{thrillLoading=null;});
}
initSidebar({onViewChange:name=>{
  currentView=name;
  effects.setVisible(name==='effects');
  surprise.setVisible(name==='surprise');
  showThrill(name==='thrill');
}});
