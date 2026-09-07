export function initSurprise() {
  const root = document.querySelector('#view-surprise');
  let visible = false, sceneApi, pending;
  async function setVisible(value) {
    visible = value;
    if (value && !sceneApi) {
      try {
        pending ||= import('../effects/galaxy-universe.js?v=gift-1').then(m => m.createUniverse(root));
        sceneApi = await pending;
      } catch (error) {
        root.querySelector('[data-surprise-status]').textContent = '暂时无法打开 3D 场景，请启用浏览器硬件加速后刷新。你仍然可以打开下方的惊喜信笺。';
        console.error('Universe initialization failed', error);
      }
    }
    sceneApi?.setVisible(visible);
  }
  const giftButton=root.querySelector('[data-open-gift]');
  const giftLabel=giftButton.textContent;
  root.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    if(giftButton.disabled)return;
    giftButton.disabled=true;
    giftButton.textContent='正在为你点亮宇宙…';
    const name = root.querySelector('input').value.trim() || '亲爱的你';
    root.querySelector('[data-recipient]').textContent = `To ${name}`;
    function revealNote(){
      root.querySelector('.surprise-note').hidden = false;
      root.classList.add('gift-revealed');
      root.querySelector('[data-close-note]').focus();
      giftButton.disabled=false;giftButton.textContent=giftLabel;
    }
    if(pending&&!sceneApi){try{sceneApi=await pending;sceneApi.setVisible(visible);}catch{ /* The letter remains available without WebGL. */ }}
    if(sceneApi?.openGift)sceneApi.openGift(revealNote);
    else revealNote();
  });
  function closeNote() {
    root.querySelector('.surprise-note').hidden = true;
    root.classList.remove('gift-revealed');
    root.querySelector('[data-open-gift]').focus();
  }
  root.querySelector('[data-close-note]').addEventListener('click', closeNote);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.querySelector('.surprise-note').hidden) closeNote(); });
  return { setVisible };
}
