import { SKETCH_CHARACTERS } from '../data/sketch-characters.js?v=watercolor-2';
import { createSketchPainter } from '../effects/sketch-painter.js?v=watercolor-2';

const PHASES = ['勾勒轮廓', '添上神情', '花草相伴', '水彩晕染', '画好啦'];
const clamp = value => Math.max(0, Math.min(1, value));

export function initSketchStudio() {
  const root = document.querySelector('[data-view-panel="light"]');
  if (!root) return { setVisible() {} };
  const find = name => root.querySelector(`[data-sketch-${name}]`);
  const stage = find('stage'), progressElement = find('progress');
  const saved = new Map(SKETCH_CHARACTERS.map(item => [item.id, 0]));
  const steps = [...root.querySelectorAll('[data-sketch-step]')];
  let selected = SKETCH_CHARACTERS[0], visible = false, initialized = false, ready = false;
  let painter, canvas, preview = false, progress = 0, target = 0;
  let previous = null, pointerId = null, frame = 0, lastTime = 0, lastInput = 0;
  let lastPercent = -1, lastPhase = -1, generation = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  find('choices').innerHTML = SKETCH_CHARACTERS.map((character, index) => `
    <button type="button" class="sketch-character" data-character="${character.id}" aria-pressed="${index === 0}" aria-label="选择${character.name}" style="--character-accent:${character.accent}">
      <span class="sketch-thumbnail"><img src="${character.image}" alt="" draggable="false" width="120" height="120"></span>
      <span class="sketch-character-name">${character.name}<small data-character-progress="${character.id}">未落笔</small></span>
      <span class="sketch-character-check" aria-hidden="true">✓</span>
    </button>`).join('');

  function resetPointer() {
    const captured = pointerId;
    previous = null; pointerId = null;
    if (captured !== null && stage.hasPointerCapture(captured)) stage.releasePointerCapture(captured);
  }
  function halt() {
    resetPointer(); cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    target = progress;
  }
  function updateUI(force = false) {
    const value = preview ? 1 : progress;
    const percent = Math.floor(value * 100);
    progressElement.value = value;
    if (percent !== lastPercent || force) {
      find('percent').textContent = `${percent}%`;
      root.querySelector(`[data-character-progress="${selected.id}"]`).textContent = progress >= 1 ? '已完成 ✓' : progress > 0 ? `${Math.floor(progress*100)}%` : '未落笔';
      lastPercent = percent;
    }
    const phase = value >= 1 ? 4 : value >= .8 ? 3 : value >= .67 ? 2 : value >= .32 ? 1 : 0;
    if (phase !== lastPhase || force) {
      find('phase').textContent = preview ? '成画预览' : PHASES[phase];
      steps.forEach((step,index) => { step.classList.toggle('is-current',phase===index); step.classList.toggle('is-done',phase>index); });
      find('status').textContent = preview ? '成画预览中，返回后会接着之前的进度。' : phase === 4 ? `${selected.name}画好啦，收藏你的这份小快乐。` : `${PHASES[phase]} · 轻轻移动鼠标，画笔就会跟上。`;
      lastPhase = phase;
    }
    find('empty').hidden = value > 0 || !ready;
    find('restart').disabled = !ready || progress === 0;
    find('save').disabled = !ready || value === 0;
    find('preview').disabled = !ready;
    find('preview').textContent = preview ? '← 返回继续画' : '先看成画';
    find('preview').setAttribute('aria-pressed',String(preview));
    stage.classList.toggle('is-preview',preview);
    stage.classList.toggle('is-complete',value >= 1 && !preview);
  }
  function tick(now) {
    frame = 0;
    if (!ready || !visible || document.hidden || preview) return;
    const dt = lastTime ? Math.min(40,now-lastTime) : 16.7;
    lastTime = now;
    const gap = target-progress;
    // Cap queued travel, then interpolate independently from pointer event cadence.
    const step = reduceMotion.matches ? gap : Math.min(gap*(1-Math.exp(-dt/38)), .008*dt/16.7);
    progress = gap < .000025 ? target : progress+step;
    if (target === 1 && progress > .9995) progress = 1;
    saved.set(selected.id,progress);
    painter.draw(progress);
    updateUI();
    if (target-progress > .000025 && now-lastInput < 240) frame = requestAnimationFrame(tick);
    else { target=progress; lastTime=0; }
  }
  function advance(amount) {
    if (!ready || !visible || document.hidden || preview || progress >= 1) return;
    target = clamp(Math.min(progress+.045,target+amount));
    if (target > .997) target=1;
    lastInput=performance.now();
    if (!frame) frame=requestAnimationFrame(tick);
  }
  async function loadCharacter(character) {
    halt();
    const token=++generation;
    selected=character;preview=false;ready=false;
    progress=target=saved.get(character.id);
    lastPhase=lastPercent=-1;
    painter=null;
    canvas=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    find('art').replaceChildren(canvas);
    stage.setAttribute('aria-busy','true');
    find('loading').textContent='正在准备画稿…';
    find('loading').hidden=false;
    find('title').textContent=character.subtitle;
    find('number').textContent=`NO. ${String(SKETCH_CHARACTERS.indexOf(character)+1).padStart(2,'0')}`;
    stage.setAttribute('aria-label',`${character.name}画布。移动鼠标或滑动手指绘制，也可按空格或方向键推进。`);
    root.querySelectorAll('[data-character]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.character===character.id)));
    updateUI(true);
    try {
      const next=await createSketchPainter(character.image,canvas);
      if (token!==generation)return;
      painter=next;ready=true;
      stage.setAttribute('aria-busy','false');
      find('loading').hidden=true;
      painter.draw(progress);
      updateUI(true);
    } catch(error) {
      if(token!==generation)return;
      stage.setAttribute('aria-busy','false');
      find('loading').textContent='画稿暂时没能打开，重新选择这个角色即可重试。';
      find('status').textContent='画稿载入失败，请重试。';
      console.error('Sketch artwork could not load',error);
    }
  }
  stage.addEventListener('pointerenter',event=>{
    if(event.pointerType==='mouse'&&visible)previous={x:event.clientX,y:event.clientY};
  });
  stage.addEventListener('pointerdown',event=>{
    if(!ready||preview||!visible||pointerId!==null||event.button!==0)return;
    event.preventDefault();stage.focus({preventScroll:true});
    pointerId=event.pointerId;previous={x:event.clientX,y:event.clientY};
    stage.setPointerCapture(pointerId);
  });
  stage.addEventListener('pointermove',event=>{
    if(!ready||!visible||preview||document.hidden)return;
    if(event.pointerType!=='mouse'&&event.pointerId!==pointerId)return;
    if(pointerId!==null&&pointerId!==event.pointerId)return;
    const rect=stage.getBoundingClientRect();
    const coalesced=event.getCoalescedEvents?.();
    const samples=coalesced?.length?coalesced:[event];
    let distance=0;
    for(const sample of samples) {
      const point={x:sample.clientX,y:sample.clientY};
      if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom){previous=null;continue;}
      if(previous)distance+=Math.hypot(point.x-previous.x,point.y-previous.y)/rect.width;
      previous=point;
    }
    if(distance)advance(Math.min(distance,.2)*Number(find('speed').value)/5.5);
  });
  stage.addEventListener('pointerleave',halt);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,event=>{if(event.pointerId===pointerId)halt();});
  stage.addEventListener('keydown',event=>{
    if(![' ','ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key))return;
    event.preventDefault();advance(.022*Number(find('speed').value));
  });
  root.querySelectorAll('[data-character]').forEach(button=>button.addEventListener('click',()=>loadCharacter(SKETCH_CHARACTERS.find(item=>item.id===button.dataset.character))));
  find('restart').addEventListener('click',()=>{
    halt();preview=false;progress=target=0;saved.set(selected.id,0);
    painter.draw(0);updateUI(true);
  });
  find('preview').addEventListener('click',()=>{
    halt();preview=!preview;painter.draw(preview?1:progress);updateUI(true);
  });
  find('save').addEventListener('click',()=>{
    if(!ready)return;
    halt();const name=selected.name;
    canvas.toBlob(blob=>{
      if(!blob){find('status').textContent='图片未能保存，请再试一次。';return;}
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`一笔一画-${name}-${Date.now()}.png`;
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      find('status').textContent=`已发起「${name}」的 PNG 下载。`;
    },'image/png');
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
  window.addEventListener('blur',halt);
  return { setVisible(value) {
    visible=value;halt();
    if(visible&&!initialized){initialized=true;loadCharacter(selected);}
  }};
}
