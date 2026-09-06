export function initSurprise() {
  const root = document.querySelector('#view-surprise');
  let visible = false, sceneApi, pending;
  async function setVisible(value) {
    visible = value;
    if (value && !sceneApi) {
      try {
        pending ||= import('../effects/galaxy-universe.js?v=galaxy-1').then(m => m.createUniverse(root));
        sceneApi = await pending;
      } catch (error) {
        root.querySelector('[data-surprise-status]').textContent = '暂时无法打开 3D 场景，请启用浏览器硬件加速后刷新。你仍然可以打开下方的惊喜信笺。';
        console.error('Universe initialization failed', error);
      }
    }
    sceneApi?.setVisible(visible);
  }
  root.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const name = root.querySelector('input').value.trim() || '亲爱的你';
    root.querySelector('[data-recipient]').textContent = `To ${name}`;
    root.querySelector('.surprise-note').hidden = false;
    root.querySelector('[data-close-note]').focus();
    sceneApi?.burst();
  });
  function closeNote() {
    root.querySelector('.surprise-note').hidden = true;
    root.querySelector('[data-open-gift]').focus();
  }
  root.querySelector('[data-close-note]').addEventListener('click', closeNote);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.querySelector('.surprise-note').hidden) closeNote(); });
  return { setVisible };
}
