import { DIFFICULTIES, challengeRules } from './agreement-difficulty.js?v=time-option-4';

export const CHALLENGES = [
  { id:'tutorial', title:'普通的同意……吗？', category:'新手条款', time:30, description:'欢迎使用本游戏。请确认你同意以下完全虚构的服务条款。', controls:'鼠标 / 触屏点击，或 Tab 选中后按回车。', hint:'第一条确实没有陷阱，点击「同意」即可。' },
  { id:'chase', title:'禁止同意逃跑', category:'追逐机关', time:35, description:'同意按钮正在逃逸。请在满屏「不同意」中抓住它。', controls:'追着绿色按钮点击；键盘可用 Tab 选中、回车确认。', hint:'按钮一开始很快，几秒后会逐渐疲惫。不要点到红色的不同意。' },
  { id:'popups', title:'弹窗套娃', category:'视觉陷阱', time:45, description:'系统似乎出了一点小问题。真正的同意，藏在最底层。', controls:'关闭遮挡的弹窗，再点击真正的「同意」。', hint:'点击右上角 × 关闭弹窗。不要相信颜色，绿色按钮也可能写着不同意。' },
  { id:'whack', title:'同意打地鼠', category:'反应挑战', time:35, description:'同意只会短暂露头。抓到 6 次即可通过，别打中不同意。', controls:'点击格子；键盘按数字 1—9 对应九宫格。', hint:'只打写着「同意」的绿色格子。漏掉不会失败，宁可等下一轮。' },
  { id:'catch', title:'接住你的同意', category:'接物挑战', time:45, description:'空空的同意按钮需要装满诚意。接住 8 份同意，避开不同意。', controls:'移动鼠标 / 拖动 / 左右方向键控制接盘。', hint:'绿色 +1，红色扣 2。看准落点再移动，不需要接住每一个。' },
  { id:'roulette', title:'同意幸运轮', category:'时机挑战', time:40, description:'让顶端指针落在绿色区域。连续命中 3 次，才算认真同意。', controls:'点击「停止」，或聚焦游戏区按空格。', hint:'绿色区域转到最上方时出手。命中后会加速并反转方向。' },
  { id:'slots', title:'三连同意机', category:'时机挑战', time:45, description:'依次停下三个滚轮，让它们全部停在「同意」。', controls:'点击各滚轮的停止按钮；键盘按 1、2、3。', hint:'每个滚轮的同意会停留约半秒。停错可以单独重新转动，无需整关重来。' },
  { id:'memory', title:'同意去哪儿了', category:'眼力挑战', time:45, description:'记住同意藏在哪个盒子里。交换位置后找出它，完成两轮。', controls:'看完洗牌再点盒子；键盘按 1、2、3 选择位置。', hint:'盯住最初绿色的盒子。盒子移动时不要改盯编号，编号代表最终位置。' },
  { id:'breakout', title:'击碎不同意', category:'弹球挑战', time:75, description:'用弹球击碎全部拒绝条款，解锁藏在后面的同意按钮。', controls:'鼠标 / 拖动 / 左右键移动挡板；点击发球或按空格。', hint:'球落到底部会损失一条生命，共 3 条。挡板不同位置会改变反弹角度。' },
  { id:'flappy', title:'同意也要飞', category:'飞行挑战', time:45, description:'带着同意飞过 5 道门。碰到条款、天花板或地板，都算不同意。', controls:'点击游戏画面或「扑腾」，也可按空格。', hint:'每次点击只轻轻上升一下，用短而规律的节奏保持在门洞中央。' },
  { id:'mash', title:'别无脑连点', category:'心理陷阱', time:40, description:'连续同意填满进度条。但按钮偶尔会变成不同意，请及时收手。', controls:'点击按钮或按空格，每次按下计一次。', hint:'同意会变黄预警，再变成红色不同意。看到黄色就放慢，红色时停手。' },
  { id:'dodge', title:'不同意弹幕', category:'生存挑战', time:35, description:'这份协议正在向你发射不同意。保护蓝色光标存活 14 秒。', controls:'鼠标 / 拖动 / 方向键移动；下方方向按钮也可操作。', hint:'你有 3 层护盾。弹幕会瞄准你，保持移动，不要一直躲在角落。' },
  { id:'runner', title:'终于可以玩游戏了', category:'最终跑酷', time:40, description:'协议已经全部同意。跳过路上的拒绝条款，冲到终点！', controls:'点击游戏画面或「跳跃」，也可按空格 / ↑。', hint:'角色会自动前进。障碍靠近到两三个身位时起跳，不要提前太多。' },
];

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const random = (low, high) => low + Math.random() * (high - low);
const overlap = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const button = (label, cls = '', extra = '') => `<button type="button" class="ag-game-button ${cls}" ${extra}>${label}</button>`;

export function createChallenge(id, { area, difficulty = 'hard', active, win, fail, status, beep }) {
  const rules = challengeRules(id, difficulty), rank = DIFFICULTIES[difficulty]?.rank ?? 1;
  area.dataset.difficulty = difficulty;
  const controller = new AbortController(), keys = new Set();
  let update = () => {}, suspend = () => {}, disposed = false;
  const on = (el, event, fn) => el.addEventListener(event, e => { if (active() && !disposed) fn(e); }, { signal:controller.signal });
  const $ = s => area.querySelector(s);
  function keyAction(fn) { on(area, 'keydown', e => { if (['Space','ArrowUp'].includes(e.code) && e.target === area && !e.repeat) { e.preventDefault(); fn(); } }); }
  function feedback(message) { status(message); beep(); }
  function complete() { if (!disposed) win(); }

  if (id === 'tutorial') {
    area.innerHTML = `<div class="ag-terms-window"><div class="ag-mini-title">服务条款 / 第 1 条 <span>?</span></div><div class="ag-terms-copy"><h3>关于你的同意</h3><p>1. 玩家理解，按钮并不总是待在原来的位置。</p><p>2. 玩家理解，绿色不一定代表同意。</p><p>3. 玩家可以随时暂停、休息，然后继续与按钮斗智斗勇。</p><p>以上全部是游戏设定。准备好了吗？</p></div><div class="ag-game-actions">${button('不同意','red')}${button('同意','green')}</div></div>`;
    on($('.green'),'click',complete); on($('.red'),'click',()=>fail('第一条就不同意？蓝豆表示尊重。'));
  }
  if (id === 'chase') {
    area.innerHTML = `<div class="ag-field-grid"></div>${Array.from({length:rules.decoys},()=>button('不同意','red ag-float')).join('')}${button('同意','green ag-float','data-target')}<span class="ag-arena-caption">抓住同意 <b data-score>0 / ${rules.hits}</b></span>`;
    const decoys=[...area.querySelectorAll('.red')], target=$('[data-target]'); let t=0,orbit=0,hits=0,cooldown=0,phase=0,pointer=null,repelX=0,repelY=0;
    const offsets=decoys.map(()=>random(0,Math.PI*2));
    decoys.forEach(el=>on(el,'click',()=>fail('抓到的是不同意。')));
    on(area,'pointermove',e=>{const box=area.getBoundingClientRect();pointer={x:(e.clientX-box.left)/box.width*100,y:(e.clientY-box.top)/box.height*100};});
    on(area,'pointerleave',()=>{pointer=null;});
    function catchTarget(){if(cooldown>0)return;hits++;$('[data-score]').textContent=`${hits} / ${rules.hits}`;if(hits>=rules.hits)return complete();phase+=random(1.4,3.2);cooldown=rules.cooldown;target.disabled=true;repelX=0;repelY=0;feedback(`抓到了！${hits} / ${rules.hits}，它又逃到别处了。`);}
    // Moving controls must accept the press before their next animation frame.
    // Capture the release, and reserve click for keyboard/assistive activation.
    on(target,'pointerdown',e=>{if(e.button!==0||cooldown>0)return;e.preventDefault();target.setPointerCapture(e.pointerId);catchTarget();});
    on(target,'click',e=>{if(e.detail===0)catchTarget();});
    const move=(el,x,y)=>{el.style.left=`${x}%`;el.style.top=`${y}%`;};
    update=dt=>{const early=Math.min(dt,Math.max(0,7-t));orbit+=early*rules.speed+(dt-early)*rules.lateSpeed;t+=dt;cooldown=Math.max(0,cooldown-dt);target.disabled=cooldown>0;const x=42+31*Math.sin(orbit+phase),y=42+29*Math.cos(orbit*1.3+phase);let pushX=0,pushY=0;if(pointer&&rules.repel){const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d>0&&d<18){pushX=dx/d*rules.repel*(1-d/18);pushY=dy/d*rules.repel*(1-d/18);}}const ease=1-Math.exp(-dt*9);repelX+=(pushX-repelX)*ease;repelY+=(pushY-repelY)*ease;move(target,clamp(x+repelX,6,77),clamp(y+repelY,8,78));decoys.forEach((el,i)=>move(el,7+i%4*21+4*Math.sin(t+offsets[i]),12+Math.floor(i/4)*62/Math.ceil(rules.decoys/4)+5*Math.cos(t*.8+offsets[i])));}; update(0);
  }
  if (id === 'popups') {
    area.innerHTML=`<div class="ag-popup-home"><strong>现在可以同意了吗？</strong>${button('同意','green','data-real')}</div>`;
    let serial=0,replacements=rules.replacements,t=0;const popups=[];
    const sync=()=>{popups.forEach((el,i)=>{el.inert=i!==popups.length-1;});$('[data-real]').disabled=popups.length>0;};
    on($('[data-real]'),'click',()=>{if(!popups.length)complete();});
    function addPopup(){
      const i=serial++,popup=document.createElement('div');popup.className='ag-error-popup';popup.style.left=`${4+i%5*5}%`;popup.style.top=`${5+i%6*7}%`;popup.style.zIndex=String(i+1);
      popup.innerHTML=`<div class="ag-mini-title">${['确认失败','还有一份条款','你确定吗','协议正在加载','最后一个弹窗，真的'][i%5]}<button type="button" aria-label="关闭弹窗 ${i+1}">×</button></div><p>${['同意之前，请先同意弹窗协议。','为了避免误操作，请不要连续乱点。','绿色按钮只是绿色而已。','关闭一个，可能还会补来一个。','关闭我，你就离同意更近一步。'][i%5]}</p><div class="ag-game-actions">${button('不同意','red')}${button('不同意','green')}</div>`;
      area.append(popup);popups.push(popup);sync();
      on(popup.querySelector('.ag-mini-title button'),'click',()=>{if(popup!==popups.at(-1))return;popups.pop();popup.remove();if(replacements>0){replacements--;addPopup();feedback('系统补发了一份条款。请继续关闭。');}else{sync();feedback(`还剩 ${popups.length} 个弹窗。`);}const next=popups.at(-1)?.querySelector('.ag-mini-title button')||$('[data-real]');next.focus({preventScroll:true});});
      popup.querySelectorAll('.ag-game-button').forEach(el=>on(el,'click',()=>fail('这个绿色按钮也写着不同意。')));
    }
    for(let i=0;i<rules.count;i++)addPopup();
    update=dt=>{t+=dt;popups.forEach((popup,i)=>{popup.style.transform=`translate(${Math.sin(t*1.7+i)*rules.motion}px,${Math.cos(t*1.3+i)*rules.motion}px)`;});};
  }
  if (id === 'whack') {
    area.innerHTML=`<div class="ag-scoreboard">抓住同意 <b data-score>0 / ${rules.hits}</b><small data-misses></small></div><div class="ag-moles">${Array.from({length:9},(_,i)=>button('·','ag-hole',`aria-label="格子 ${i+1}"`)).join('')}</div>`;
    const holes=[...area.querySelectorAll('.ag-hole')];let timer=0,hits=0,misses=0,target=-1,cooldown=0,bad=new Set();
    function paint(){holes.forEach((el,i)=>{el.textContent=i===target?'同意':bad.has(i)?'不同意':'·';el.className=`ag-game-button ag-hole ${i===target?'green':bad.has(i)?'red':''}`;});$('[data-misses]').textContent=rank?`漏点 ${misses} / ${rules.maxMisses}`:'';}
    function appear(){target=Math.floor(random(0,9));bad.clear();while(bad.size<rules.bad){const i=Math.floor(random(0,9));if(i!==target)bad.add(i);}timer=0;paint();}
    function hit(i){if(bad.has(i))return fail('打中了不同意。');if(i!==target||cooldown>0)return;hits++;$('[data-score]').textContent=`${hits} / ${rules.hits}`;beep();if(hits===rules.hits)return complete();target=-1;bad.clear();cooldown=.16;paint();}
    holes.forEach((el,i)=>on(el,'click',()=>hit(i)));on(area,'keydown',e=>{if(/^[1-9]$/.test(e.key)&&!e.repeat)hit(Number(e.key)-1);});
    update=dt=>{if(cooldown>0){cooldown-=dt;if(cooldown<=0)appear();return;}timer+=dt;if(timer>=rules.interval){misses++;if(misses>rules.maxMisses)return fail(`漏掉了 ${misses} 次同意，反应时间已经用完。`);appear();}};appear();
  }
  if (id === 'roulette') {
    area.innerHTML=`<div class="ag-scoreboard">连续命中 <b data-score>0 / ${rules.hits}</b></div><div class="ag-wheel-wrap"><span class="ag-wheel-pointer">▼</span><div class="ag-wheel"><span>✓</span><b>不同意</b></div><i>?</i></div><div class="ag-game-actions">${button('停止','blue')}</div>`;
    const wheel=$('.ag-wheel'),stopButton=$('button'),label=wheel.querySelector('span'),mid=rules.arc/2*Math.PI/180;
    wheel.style.setProperty('--ag-wheel-arc',`${rules.arc}deg`);label.style.left=`${50+35*Math.sin(mid)}%`;label.style.top=`${50-35*Math.cos(mid)}%`;
    let angle=random(120,240),hits=0,cooldown=0;
    function shot(){if(cooldown>0)return;const pos=((360-angle)%360+360)%360;if(pos<rules.arc){hits++;beep();$('[data-score]').textContent=`${hits} / ${rules.hits}`;if(hits===rules.hits)return complete();cooldown=.65;angle=random(100,280);wheel.style.transform=`rotate(${angle}deg)`;stopButton.disabled=true;feedback('命中！转盘换位，下一轮加速反转。');}else fail('指针停在了不同意区域。');}
    on(stopButton,'click',shot);keyAction(shot);update=dt=>{if(cooldown>0){cooldown=Math.max(0,cooldown-dt);stopButton.disabled=cooldown>0;return;}angle=(angle+dt*(hits%2?-1:1)*(rules.speed+hits*rules.increment)+360)%360;wheel.style.transform=`rotate(${angle}deg)`;};update(0);
  }
  if (id === 'slots') {
    area.innerHTML=`<div class="ag-scoreboard">请凑齐三个「同意」</div><div class="ag-slots">${[0,1,2].map(i=>`<div><div class="ag-reel" data-reel="${i}">同意</div>${button('停止 '+(i+1),'blue',`data-stop="${i}"`)}</div>`).join('')}</div>`;
    const reels=[...area.querySelectorAll('.ag-reel')],buttons=[...area.querySelectorAll('[data-stop]')];const phases=[0,1,2].map(i=>rank?(rules.interval+i*.012)*random(1,3):random(0,2)),stopped=[false,false,false],values=[0,0,0];
    let misses=0;
    function stop(i){stopped[i]=!stopped[i];buttons[i].textContent=stopped[i]?'重转 '+(i+1):'停止 '+(i+1);beep();if(stopped[i]&&values[i]!==0){misses++;if(misses>=rules.misses)return fail(`滚轮停错了 ${misses} 次，协议作废。`);status(rank?`停错 ${misses} / ${rules.misses} 次，可以单独重转。`:'停错了，点击重转再试。');}if(stopped.every(Boolean)&&values.every(v=>v===0))complete();}
    buttons.forEach((el,i)=>on(el,'click',()=>stop(i)));on(area,'keydown',e=>{if(/^[1-3]$/.test(e.key)&&!e.repeat)stop(Number(e.key)-1);});
    update=dt=>{reels.forEach((el,i)=>{if(!stopped[i]){phases[i]+=dt;values[i]=Math.floor(phases[i]/(rules.interval+i*.012))%3;el.textContent=['同意','不同意','再想想'][values[i]];el.classList.toggle('good',values[i]===0);}});};update(0);
  }
  if (id === 'memory') {
    area.innerHTML=`<div class="ag-scoreboard" data-memory-label>第 1 / ${rules.rounds} 轮：看清同意的位置</div><div class="ag-cups">${Array.from({length:rules.cups},(_,i)=>button('?', 'ag-cup',`data-cup="${i}"`)).join('')}</div>`;
    const cups=[...area.querySelectorAll('.ag-cup')];let t=0,round=0,phase='show',positions=cups.map((_,i)=>i),from=[...positions],swaps=0,pair=[0,1],target=Math.floor(random(0,rules.cups));
    function paint(){cups.forEach((el,i)=>{el.style.left=`${positions[i]*96/rules.cups+3}%`;el.style.width=`${88/rules.cups}%`;el.textContent=phase==='show'&&i===target?'同意':'?';el.classList.toggle('revealed',phase==='show'&&i===target);el.setAttribute('aria-label',phase==='pick'?`盒子 ${Math.round(positions[i])+1}`:'正在洗牌的盒子');});}
    function choose(i){if(phase!=='pick'||i<0)return;if(i!==target)return fail('同意藏在另一个盒子里。');round++;if(round===rules.rounds)return complete();feedback('找到了！下一轮洗牌会更快。');t=0;swaps=0;phase='show';target=Math.floor(random(0,rules.cups));$('[data-memory-label]').textContent=`第 ${round+1} / ${rules.rounds} 轮：记住同意的位置`;paint();}
    cups.forEach((el,i)=>on(el,'click',()=>choose(i)));on(area,'keydown',e=>{if(/^[1-5]$/.test(e.key)&&Number(e.key)<=rules.cups&&!e.repeat)choose(positions.indexOf(Number(e.key)-1));});
    function prepareSwap(){from=[...positions];pair=[Math.floor(random(0,rules.cups)),0];pair[1]=(pair[0]+Math.floor(random(1,rules.cups)))%rules.cups;}
    update=dt=>{t+=dt;if(phase==='show'&&t>rules.show){phase='shuffle';t=0;prepareSwap();$('[data-memory-label]').textContent='盯住它，开始换位！';}if(phase==='shuffle'){const duration=rules.duration*(1-round*.12),progress=clamp(t/duration,0,1),ease=progress*progress*(3-2*progress);const[a,b]=pair;positions[a]=from[a]+(from[b]-from[a])*ease;positions[b]=from[b]+(from[a]-from[b])*ease;if(progress===1){swaps++;t=0;if(swaps>=rules.swaps+round){phase='pick';$('[data-memory-label]').textContent=`第 ${round+1}/${rules.rounds} 轮：同意在哪个盒子？`;}else prepareSwap();}paint();}};paint();
  }
  if (id === 'mash') {
    area.innerHTML=`<div class="ag-scoreboard">同意浓度 <b data-score>0%</b></div><div class="ag-mash-meter"><i></i></div><div class="ag-mash-zone">${button('同意','green','data-mash')}</div><span class="ag-arena-caption">请不要盲目相信刚刚看到的按钮。</span>`;
    let t=0,value=0,red=false,lastHit=-1;const target=$('[data-mash]');
    function hit(){if(red)return fail('按钮变成不同意时，你还在连点。');if(t-lastHit<.09)return;lastHit=t;value=Math.min(100,value+rules.gain);beep();if(value>=100&&t>=rules.minimum)complete();else if(value>=100)status(`还需坚持到 ${rules.minimum} 秒，注意按钮变色。`);}
    on(target,'click',hit);keyAction(hit);update=dt=>{t+=dt;value=Math.max(0,value-dt*rules.decay);const phase=t%(rules.green+rules.warning+rules.red);red=phase>=rules.green+rules.warning;target.textContent=red?'不同意':phase>=rules.green?'同意…':'同意';target.className=`ag-game-button ${red?'red':phase>=rules.green?'yellow':'green'}`;target.style.transform=`translateX(${Math.sin(t*(rank?2.1:1.5))*rules.motion}px)`;$('.ag-mash-meter i').style.width=`${value}%`;$('[data-score]').textContent=`${Math.floor(value)}% · ${Math.floor(t)} 秒`;};
  }

  // Fixed logical coordinates keep physics and hit boxes identical at every screen size.
  if (['catch','breakout','flappy','dodge','runner'].includes(id)) {
    area.innerHTML=`<canvas class="ag-game-canvas" aria-label="${CHALLENGES.find(c=>c.id===id).title}，操作说明在游戏区下方"></canvas><div class="ag-game-controls"></div>`;
    const canvas=$('canvas'),ctx=canvas.getContext('2d');const W=800,H=420;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.scale(dpr,dpr);
    let pointer={x:400,y:330},pointerUsed=false,action=()=>{};
    const controls=$('.ag-game-controls');
    const labels=id==='flappy'?[['Space','扑腾 ↑']]:id==='runner'?[['Space','跳跃 ↑']]:id==='dodge'?[['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→']]:id==='catch'?[['ArrowLeft','←'],['ArrowRight','→']]:[['ArrowLeft','←'],['Space','发球'],['ArrowRight','→']];
    controls.innerHTML=labels.map(([key,label])=>button(label,'blue',`data-key="${key}" aria-label="${label}"`)).join('');
    controls.querySelectorAll('button').forEach(el=>{
      const key=el.dataset.key;
      if(key==='Space')on(el,'click',()=>action());
      else {on(el,'pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys.add(key);pointerUsed=false;});for(const type of ['pointerup','pointercancel','lostpointercapture'])on(el,type,()=>keys.delete(key));on(el,'keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keys.add(key);pointerUsed=false;}});on(el,'keyup',()=>keys.delete(key));}
    });
    function movePointer(e){const box=canvas.getBoundingClientRect();pointer={x:clamp((e.clientX-box.left)/box.width*W,0,W),y:clamp((e.clientY-box.top)/box.height*H,0,H)};pointerUsed=true;}
    on(canvas,'pointermove',movePointer);on(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);movePointer(e);if(id==='flappy'||id==='runner'||id==='breakout')action();});
    on(area,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)&&e.target===area){e.preventDefault();keys.add(e.code);pointerUsed=false;if(!e.repeat&&(e.code==='Space'||e.code==='ArrowUp'&&id==='runner'))action();}});
    on(area,'keyup',e=>keys.delete(e.code));
    suspend=()=>{keys.clear();pointerUsed=false;};
    const rect=(x,y,w,h,color,r=5)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
    const text=(label,x,y,size=18,color='#314866',align='center')=>{ctx.fillStyle=color;ctx.font=`700 ${size}px "Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.fillText(label,x,y);};
    const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
    function background(){ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#e5ebf2';ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
    function moveX(x,dt,width=130){if(pointerUsed)return clamp(rank?x+clamp(pointer.x-x,-640*dt,640*dt):pointer.x,width/2,W-width/2);return clamp(x+((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*520*dt,width/2,W-width/2);}
    function drawTag(x,y,label,good,width=84){rect(x-width/2,y-17,width,34,good?'#8bdeb0':'#f1a3b1');text(label,x,y+6,17,good?'#175936':'#8b233c');}

    if(id==='catch'){
      let x=400,spawn=0,score=0,mistakes=0,items=[];
      action=()=>{status('移动接盘去接绿色同意。红色不同意会扣分。');};
      update=dt=>{x=moveX(x,dt,rules.width);spawn-=dt;if(spawn<=0){spawn=rules.spawn;items.push({x:random(60,740),y:-25,good:Math.random()>=rules.red});}background();text(`同意 ${score} / ${rules.goal}${rank?`   接错 ${mistakes} / ${rules.lives}`:''}`,25,32,21,'#314866','left');for(const item of items){const oldY=item.y;item.y+=rules.speed*dt;drawTag(item.x,item.y,item.good?'同意':'不同意',item.good);if(oldY<348&&item.y>=348&&Math.abs(item.x-x)<rules.width/2+34){score=clamp(score+(item.good?1:-2),0,rules.goal);if(!item.good)mistakes++;item.y=500;feedback(item.good?`接住了！${score}/${rules.goal}`:'接到了不同意，扣 2 份诚意。');if(mistakes>=rules.lives)return fail(`接错了 ${mistakes} 次不同意。`);if(score>=rules.goal)return complete();}}items=items.filter(item=>item.y<450);rect(x-rules.width/2,374,rules.width,22,'#356ba9');rect(x-rules.width/2+4,365,rules.width-8,12,'#a7c7e9');text('接住同意',x,407,15);};
    }
    if(id==='breakout'){
      const initialX=rules.speed*.38,initialY=-Math.sqrt(rules.speed**2-initialX**2),cell=660/rules.columns;
      let x=400,ball={x:400,y:346,vx:initialX,vy:initialY},launched=false,lives=rules.lives;
      const bricks=Array.from({length:rules.columns*rules.rows},(_,i)=>({x:70+i%rules.columns*cell,y:70+Math.floor(i/rules.columns)*44,w:cell-15,h:30,hp:rules.armored&&i%3!==1?2:1}));
      action=()=>{launched=true;};
      const accept=document.createElement('button');accept.className='ag-game-button green ag-brick-accept';accept.textContent='同意';accept.hidden=true;area.append(accept);on(accept,'click',complete);
      update=dt=>{x=moveX(x,dt,rules.width);background();text(`生命 ${'♥'.repeat(lives)}   条款 ${bricks.filter(b=>!b.hp).length}/${bricks.length}`,25,30,18,'#314866','left');if(bricks.every(b=>!b.hp)){text('拒绝条款已清除，点击同意！',400,250,26,'#286944');accept.hidden=false;return;}if(!launched){ball.x=x;ball.y=346;text('点击发球 / 空格',400,285,19);}else{
        const steps=Math.max(1,Math.ceil(dt/.006));for(let s=0;s<steps;s++){const step=dt/steps,oldX=ball.x,oldY=ball.y;ball.x+=ball.vx*step;ball.y+=ball.vy*step;if(ball.x<9||ball.x>791){ball.x=clamp(ball.x,9,791);ball.vx*=-1;}if(ball.y<45){ball.y=45;ball.vy=Math.abs(ball.vy);}if(ball.vy>0&&ball.y+9>=358&&oldY-9<375&&Math.abs(ball.x-x)<rules.width/2+9){const offset=clamp((ball.x-x)/(rules.width/2),-.95,.95);ball.vx=(offset<0?-1:1)*Math.max(rules.speed*.17,Math.abs(offset)*rules.speed*.82);ball.vy=-Math.sqrt(rules.speed**2-ball.vx**2);ball.y=348;beep();}for(const b of bricks){if(b.hp&&overlap({x:ball.x-9,y:ball.y-9,w:18,h:18},b)){b.hp--;if(oldY+9<=b.y){ball.y=b.y-9-.1;ball.vy=-Math.abs(ball.vy);}else if(oldY-9>=b.y+b.h){ball.y=b.y+b.h+9+.1;ball.vy=Math.abs(ball.vy);}else if(oldX<b.x){ball.x=b.x-9-.1;ball.vx=-Math.abs(ball.vx);}else{ball.x=b.x+b.w+9+.1;ball.vx=Math.abs(ball.vx);}beep();break;}}if(ball.y>430){lives--;if(lives<=0)return fail('弹球全部掉下去了。');launched=false;ball.vx=initialX;ball.vy=initialY;break;}}
      }bricks.filter(b=>b.hp).forEach(b=>{rect(b.x,b.y,b.w,b.h,b.hp>1?'#ae647d':'#e9a3ad');text(b.hp>1?'不同意 ×2':'不同意',b.x+b.w/2,b.y+21,15,b.hp>1?'#fff':'#8f3446');});circle(ball.x,ball.y,9,'#285a98');rect(x-rules.width/2,358,rules.width,17,'#578dd0');};
    }
    if(id==='flappy'){
      let y=210,vy=0,t=0,started=false,passed=0,lastGap=210;const pipes=Array.from({length:rules.goal},(_,i)=>{lastGap=clamp(lastGap+random(-45,45),160,255);return{x:650+i*rules.spacing,base:lastGap,gap:lastGap,phase:random(0,Math.PI*2),passed:false};});
      action=()=>{started=true;vy=-285;beep();};
      update=dt=>{background();if(started){t+=dt;vy+=760*dt;y+=vy*dt;}text(`穿过条款 ${passed} / ${rules.goal}`,25,32,20,'#314866','left');for(const p of pipes){if(started){p.x-=rules.speed*dt;p.gap=p.base+Math.sin(t*1.7+p.phase)*rules.motion;}const half=rules.gap/2;rect(p.x,48,66,Math.max(0,p.gap-half-48),'#ba7186');rect(p.x,p.gap+half,66,420-p.gap-half,'#ba7186');text('拒',p.x+33,80,20,'#fff');if(p.x<175&&p.x+66>145&&(y-13<p.gap-half||y+13>p.gap+half))return fail('同意撞上了拒绝条款。');if(!p.passed&&p.x+66<145){p.passed=true;passed++;beep();if(passed===rules.goal)return complete();}}if(y<58||y>405)return fail('同意飞出了安全范围。');circle(160,y,15,'#488de0');text('✓',160,y+7,20,'#fff');if(!started)text('点击 / 空格，让同意飞起来',430,220,23);};
    }
    if(id==='dodge'){
      let p={x:400,y:320},t=0,spawn=1,wave=0,shields=rules.shields,invincible=0;let bullets=[],warnings=[];
      update=dt=>{t+=dt;spawn-=dt;invincible=Math.max(0,invincible-dt);if(pointerUsed){const dx=pointer.x-p.x,dy=pointer.y-p.y,d=Math.hypot(dx,dy),m=Math.min(d,430*dt);if(d){p.x+=dx/d*m;p.y+=dy/d*m;}}else{p.x+=((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*370*dt;p.y+=((keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0))*370*dt;}p.x=clamp(p.x,15,785);p.y=clamp(p.y,65,405);
        if(spawn<=0){spawn=rules.interval*(rank&&t>rules.duration/2?.78:1);const side=rules.sides?wave%3:0;let bx=side===1?18:side===2?782:random(80,720),by=side?random(110,350):55;if(Math.hypot(bx-p.x,by-p.y)<180){if(side)by=p.y>230?85:385;else bx=p.x>400?100:700;}warnings.push({x:bx,y:by,aim:Math.atan2(p.y-by,p.x-bx),delay:rank?.5:.25});wave++;}
        background();text(`护盾 ${'◆'.repeat(shields)}  生存 ${Math.min(rules.duration,t).toFixed(1)} / ${rules.duration} 秒`,25,32,19,'#314866','left');
        for(const warning of warnings){warning.delay-=dt;ctx.strokeStyle='#d85d80';ctx.lineWidth=3;ctx.beginPath();ctx.arc(warning.x,warning.y,16+Math.max(0,warning.delay)*22,0,Math.PI*2);ctx.stroke();if(warning.delay<=0){for(let j=-rules.spread;j<=rules.spread;j++){const a=warning.aim+j*.32;bullets.push({x:warning.x,y:warning.y,vx:Math.cos(a)*rules.speed,vy:Math.sin(a)*rules.speed});}}}warnings=warnings.filter(w=>w.delay>0);
        for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;circle(b.x,b.y,9,'#d85d80');if(!invincible&&Math.hypot(b.x-p.x,b.y-p.y)<20){shields--;invincible=rank?1:1.2;beep('fail');if(shields<=0)return fail('光标被不同意弹幕击中了。');status(`护盾被击破！还剩 ${shields} 层。`);}}
        bullets=bullets.filter(b=>b.x>-20&&b.x<820&&b.y>40&&b.y<450);circle(p.x,p.y,invincible?20:13,invincible?'#b4d6f2':'#3c85d3');text('✓',p.x,p.y+6,16,'white');if(t>=rules.duration)return complete();};
    }
    if(id==='runner'){
      let distance=0,y=320,vy=0,started=false,spawnX=650;
      const maxSpeed=rules.speed*(rank?1.16:1),minimumSpacing=Math.max(rules.spacing,maxSpeed*600/700+48);
      const obstacles=Array.from({length:rules.count},(_,i)=>{if(i)spawnX+=minimumSpacing+random(0,rank?85:60);return{x:spawnX,w:rank?Math.round(random(42+rank*5,55+rank*13)):i%2?44:34,h:rank?i%3?50+rank*3:64+rank*4:i%3?46:62};});
      const finishDistance=obstacles.at(-1).x+350,finishAt=finishDistance-110;
      action=()=>{started=true;if(y>=319){vy=-600;beep();}};
      update=dt=>{background();const speed=rules.speed*(1+(rank?.16:0)*clamp((distance/finishAt-.35)/.45,0,1));if(started){distance+=speed*dt;vy+=1400*dt;y=Math.min(320,y+vy*dt);if(y===320)vy=0;}
        ctx.fillStyle='#d9eacd';ctx.fillRect(0,354,W,66);rect(0,351,800,5,'#71a667',0);text(`离终点 ${Math.max(0,Math.ceil((finishDistance-distance)/100))} 米${rank&&speed>rules.speed*1.05?' · 正在加速':''}`,25,32,20,'#314866','left');for(const b of obstacles){const x=b.x-distance;if(x>-90&&x<820){rect(x,354-b.h,b.w,b.h,'#ca7181',3);text('×',x+b.w/2,354-b.h/2+7,23,'white');if(overlap({x:120,y:y+3,w:31,h:31},{x,y:354-b.h,w:b.w,h:b.h}))return fail('被路上的拒绝条款绊倒了。');}}
        rect(116,y,38,34,'#3878bd',7);circle(143,y+10,3,'#fff');rect(120,y+34,9,6,'#264e7b',1);rect(141,y+34,9,6,'#264e7b',1);const finishX=finishDistance-distance;rect(finishX,170,5,184,'#314866',0);rect(finishX+5,170,85,47,'#80c59a',0);text('终点',finishX+46,202,22,'#18462e');if(!started)text('点击 / 空格起跳，正式开跑！',420,210,24);if(distance>=finishAt)return complete();};
    }
    update(0);
  }
  return { update(dt){if(!disposed)update(dt);}, suspend(){keys.clear();suspend();}, dispose(){disposed=true;controller.abort();keys.clear();} };
}

