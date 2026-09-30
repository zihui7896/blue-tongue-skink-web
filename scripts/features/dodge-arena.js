// Fixed logical arena: CSS resize and fullscreen never change gameplay geometry.
const W=960,H=600,DURATION=60;
const LEVELS={easy:{name:'热身',speed:125,interval:.95,count:7,gap:210},normal:{name:'心跳',speed:175,interval:.68,count:10,gap:165},hard:{name:'极限',speed:220,interval:.5,count:13,gap:130}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Swept collision prevents fast dashes / bullets from skipping a small hitbox.
function segmentDistance(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(px-ax-t*dx,py-ay-t*dy);
}

export function initDodgeArena(){
  const root=document.querySelector('#view-dodge'),q=s=>root.querySelector(`[data-dodge-${s}]`);
  const canvas=q('canvas'),ctx=canvas.getContext('2d'),overlay=q('overlay'),start=q('start');
  if(!ctx){q('status').textContent='当前浏览器不支持 Canvas，请换一个浏览器体验。';start.disabled=true;return{setVisible(){}};}
  let level='normal',state='ready',visible=false,raf=0,last=0,elapsed=0,score=0,lives=3;
  let bullets=[],lasers=[],cores=[],particles=[],trail=[],keys=new Set(),pointer=null,pointerId=null;
  let player={x:W/2,y:H/2},direction={x:0,y:-1},cooldown=0,dashing=0,invincible=0;
  let shotAt=.8,laserAt=41,coreAt=4,combo=0,comboUntil=0,feedbackUntil=0,sound=false,audio;
  let best={};
  try{const saved=JSON.parse(localStorage.getItem('landou-dodge-v1')||'{}');if(saved&&typeof saved==='object')best=saved;}catch{/* Storage is optional. */}
  const record=()=>{q('record-level').textContent=LEVELS[level].name;q('best').textContent=Number.isFinite(best[level])?Math.floor(best[level]).toLocaleString('zh-CN'):'—';};

  function beep(freq=440,duration=.06){
    if(!sound)return;
    try{
      if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();}
      if(audio.state==='suspended')void audio.resume().catch(()=>{});
      const oscillator=audio.createOscillator(),gain=audio.createGain();
      oscillator.type='sine';oscillator.frequency.value=freq;
      gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }catch{/* Audio must never interrupt a run. */}
  }
  function burst(x,y,color,n=14){for(let i=0;i<n;i++){const angle=Math.random()*Math.PI*2,speed=45+Math.random()*160;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.55,color});}}
  function feedback(text){q('feedback').textContent=text;feedbackUntil=elapsed+1.1;}
  function hud(){
    q('time').innerHTML=`${Math.max(0,DURATION-elapsed).toFixed(1)}<em>s</em>`;
    q('score').textContent=String(Math.floor(score)).padStart(5,'0');
    q('lives').textContent=Array.from({length:3},(_,i)=>i<lives?'◆':'◇').join(' ');q('lives').setAttribute('aria-label',`剩余 ${lives} 格护盾`);
    q('wave').textContent=elapsed<20?'交叉火力':elapsed<40?'旋涡弹幕':'激光封锁';
    q('dash').innerHTML=cooldown>0?`冲刺 · ${cooldown.toFixed(1)}s`:'冲刺 · 就绪 <kbd>Space</kbd>';
    q('dash').disabled=state!=='running'||cooldown>0;q('pause').disabled=!['running','paused'].includes(state);
    q('pause').innerHTML=state==='paused'?'继续 <kbd>P</kbd>':'暂停 <kbd>P</kbd>';
  }
  function clearInput(){keys.clear();pointer=null;if(pointerId!==null&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);pointerId=null;}
  function showOverlay(tag,title,message,button){q('tag').textContent=tag;q('title').textContent=title;q('message').textContent=message;start.textContent=button;overlay.hidden=false;}
  function stopLoop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function pause(reason='休息一下。准备好后继续。'){
    if(state!=='running')return;
    state='paused';stopLoop();clearInput();hud();draw();
    showOverlay('TAKE A BREATH', '心跳暂停，进度保留。',reason,'继续挑战 ↗');q('status').textContent=reason;
  }
  function run(){
    if(!visible||document.hidden)return;
    state='running';overlay.hidden=true;last=0;clearInput();canvas.focus({preventScroll:true});hud();
    q('status').textContent='鼠标 / 拖动 / WASD 移动，空格冲刺，P 或 Esc 暂停。粉色弹幕和激光会消耗护盾。';
    stopLoop();raf=requestAnimationFrame(frame);
  }
  function reset(startRun=true){
    stopLoop();clearInput();state='ready';
    elapsed=0;score=0;lives=3;bullets=[];lasers=[];cores=[];particles=[];trail=[];
    player={x:W/2,y:H/2};direction={x:0,y:-1};cooldown=0;dashing=0;invincible=.8;
    shotAt=.8;laserAt=41;coreAt=4;combo=0;comboUntil=0;feedbackUntil=0;q('feedback').textContent='';
    root.querySelectorAll('[data-dodge-level]').forEach(b=>b.disabled=startRun);
    if(startRun)run();else{
      invincible=0;hud();draw();showOverlay('READY FOR A NEW RUN','换个节奏，再来一局。','可以重新选择难度。\n点击开始后，计时才会继续。','开始挑战 ↗');
      q('status').textContent='已重置，可重新选择难度并开始挑战。';
    }
  }
  function finish(won){
    state='over';stopLoop();clearInput();if(won)score+=2000+lives*500;
    const finalScore=Math.floor(score),isBest=finalScore>(Number.isFinite(best[level])?best[level]:-1);
    if(isBest){best[level]=finalScore;try{localStorage.setItem('landou-dodge-v1',JSON.stringify(best));}catch{/* Continue without persistence. */}}
    q('feedback').textContent='';record();hud();draw();root.querySelectorAll('[data-dodge-level]').forEach(b=>b.disabled=false);
    showOverlay(won?'SURVIVED / 60 SECONDS':isBest?'NEW PERSONAL BEST':'ONE MORE TRY?',won?'这 60 秒，你撑住了。':'差一点，就穿过去了。',`${LEVELS[level].name} · 得分 ${finalScore.toLocaleString('zh-CN')} · 生存 ${elapsed.toFixed(1)} 秒\n${isBest?'刷新了本机纪录。':'换个走位，再挑战一次。'}${won?' 通关奖励已计入。':''}`,'再来一局 ↗');
    q('status').textContent=`${won?'挑战成功':'本局结束'}，得分 ${finalScore}，生存 ${elapsed.toFixed(1)} 秒。`;beep(won?880:180,.2);
  }
  function dash(){
    if(state!=='running'||cooldown>0)return;
    let dx=0,dy=0;
    if(pointer){dx=pointer.x-player.x;dy=pointer.y-player.y;}
    else{dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));}
    const length=Math.hypot(dx,dy);if(length>0)direction={x:dx/length,y:dy/length};
    dashing=.22;invincible=Math.max(invincible,.3);cooldown=2.4;burst(player.x,player.y,'#6ff1ea',10);beep(620);hud();
  }
  function spawnBullet(x,y,angle,speed){bullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:5,grazed:false});}
  function shoot(){
    const config=LEVELS[level],speed=config.speed*(1+elapsed/130);
    if(elapsed<20||elapsed>=40){
      const side=Math.floor(Math.random()*4),x=side===0?8:side===1?W-8:50+Math.random()*(W-100),y=side===2?8:side===3?H-8:50+Math.random()*(H-100);
      const angle=Math.atan2(player.y-y,player.x-x);
      for(let i=-2;i<=2;i++)spawnBullet(x,y,angle+i*.19,speed);
    }else{
      const cx=W/2+Math.cos(elapsed*.5)*200,cy=H/2+Math.sin(elapsed*.4)*130;
      for(let i=0;i<config.count;i++)spawnBullet(cx,cy,elapsed*1.3+i*Math.PI*2/config.count,speed*.82);
      burst(cx,cy,'#e578bd',5);
    }
  }
  function spawnLaser(){
    const vertical=Math.random()>.5,limit=vertical?W:H,gapLimit=vertical?H:W;
    lasers.push({vertical,pos:clamp((vertical?player.x:player.y)+(Math.random()-.5)*150,50,limit-50),gap:clamp((vertical?player.y:player.x)+(Math.random()-.5)*100,LEVELS[level].gap/2,gapLimit-LEVELS[level].gap/2),age:0});
    feedback('激光预警 · 找缺口 / 冲刺');
  }
  function hit(){
    if(invincible>0)return;
    lives--;combo=0;invincible=1.5;burst(player.x,player.y,'#ff719b',25);feedback('护盾 −1 · 别停下');beep(150,.15);
    if(lives<=0)finish(false);
  }
  function update(dt){
    elapsed=Math.min(DURATION,elapsed+dt);score+=dt*35;cooldown=Math.max(0,cooldown-dt);invincible=Math.max(0,invincible-dt);
    const previous={...player};let dx=0,dy=0;
    if(dashing>0){dx=direction.x*880*dt;dy=direction.y*880*dt;dashing=Math.max(0,dashing-dt);}
    else{
      const kx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),ky=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
      if(kx||ky){const length=Math.hypot(kx,ky);dx=kx/length*330*dt;dy=ky/length*330*dt;pointer=null;}
      else if(pointer){const vx=pointer.x-player.x,vy=pointer.y-player.y,length=Math.hypot(vx,vy),step=Math.min(length,430*dt);if(length){dx=vx/length*step;dy=vy/length*step;}}
      if(Math.hypot(dx,dy)>.01){const length=Math.hypot(dx,dy);direction={x:dx/length,y:dy/length};}
    }
    player.x=clamp(player.x+dx,12,W-12);player.y=clamp(player.y+dy,12,H-12);
    trail.push({...player,life:.23});trail=trail.filter(t=>(t.life-=dt)>0);
    if(elapsed>=shotAt){shoot();shotAt=elapsed+LEVELS[level].interval*(elapsed>=40?1.35:1);}
    if(elapsed>=laserAt){spawnLaser();laserAt=elapsed+(level==='hard'?2.5:3.4);}
    if(elapsed>=coreAt){cores.push({x:50+Math.random()*(W-100),y:50+Math.random()*(H-100),life:7});coreAt=elapsed+5;}
    for(const b of bullets){
      const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
      const dist=segmentDistance(0,0,oldX-previous.x,oldY-previous.y,b.x-player.x,b.y-player.y);
      if(dist<11&&invincible<=0){b.dead=true;hit();if(state==='over')return;}
      else if(dist<29&&dist>=11&&!b.grazed&&invincible<=0){b.grazed=true;combo=elapsed<comboUntil?Math.min(5,combo+1):1;comboUntil=elapsed+2;score+=80*combo;feedback(`擦弹 +${80*combo} · ×${combo}`);beep(780+combo*60,.035);}
    }
    bullets=bullets.filter(b=>!b.dead&&b.x>-40&&b.x<W+40&&b.y>-40&&b.y<H+40);
    for(const laser of lasers){
      laser.age+=dt;
      if(laser.age>=.95&&laser.age<1.65){
        // Intersect the full motion segment with the beam; the gap remains safe.
        const axis=laser.vertical?'x':'y',other=laser.vertical?'y':'x',a=previous[axis],b=player[axis];
        const crosses=Math.min(a,b)<=laser.pos+12&&Math.max(a,b)>=laser.pos-12;
        const t=clamp((laser.pos-a)/(b-a||1),0,1),along=previous[other]+(player[other]-previous[other])*t;
        if(crosses&&Math.abs(along-laser.gap)>LEVELS[level].gap/2-7){hit();if(state==='over')return;}
      }
    }
    lasers=lasers.filter(l=>l.age<1.65);
    for(const core of cores){core.life-=dt;if(segmentDistance(core.x,core.y,previous.x,previous.y,player.x,player.y)<23){core.life=0;score+=250;cooldown=0;burst(core.x,core.y,'#ffd284',18);feedback('能量 +250 · 冲刺已刷新');beep(1100);}}
    cores=cores.filter(c=>c.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    if(elapsed>feedbackUntil)q('feedback').textContent='';
    if(elapsed>=DURATION)finish(true);
  }
  function glow(color,blur=12){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.fillStyle=color;ctx.strokeStyle=color;}
  function draw(){
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0b1022';ctx.fillRect(0,0,W,H);
    const gradient=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.7);gradient.addColorStop(0,'#192849');gradient.addColorStop(1,'#0b1022');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
    ctx.lineWidth=1;ctx.strokeStyle='#779edb13';ctx.beginPath();for(let x=0;x<W;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=0;y<H;y+=40){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();
    ctx.strokeStyle='#668bc940';ctx.strokeRect(8,8,W-16,H-16);
    for(const laser of lasers){
      const active=laser.age>=.95,gap=LEVELS[level].gap/2;
      ctx.save();glow(active?'#ff648d':'#df728d',active?25:0);ctx.globalAlpha=active?1:.65;ctx.lineWidth=active?12:2;ctx.setLineDash(active?[]:[10,12]);ctx.beginPath();
      if(laser.vertical){ctx.moveTo(laser.pos,0);ctx.lineTo(laser.pos,laser.gap-gap);ctx.moveTo(laser.pos,laser.gap+gap);ctx.lineTo(laser.pos,H);}
      else{ctx.moveTo(0,laser.pos);ctx.lineTo(laser.gap-gap,laser.pos);ctx.moveTo(laser.gap+gap,laser.pos);ctx.lineTo(W,laser.pos);}
      ctx.stroke();ctx.restore();
    }
    for(const core of cores){ctx.save();ctx.translate(core.x,core.y);ctx.rotate(elapsed*1.8);glow('#ffd284',18);ctx.globalAlpha=core.life<1?core.life:1;ctx.strokeRect(-8,-8,16,16);ctx.fillRect(-3,-3,6,6);ctx.restore();}
    glow('#ff80b2',13);for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}
    ctx.shadowBlur=0;for(const p of particles){ctx.globalAlpha=clamp(p.life/.55,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
    glow('#6ff1ea',16);for(const t of trail){ctx.globalAlpha=t.life/.23*.3;ctx.beginPath();ctx.arc(t.x,t.y,6,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    if(invincible<=0||dashing>0||Math.floor(elapsed*12)%2===0){
      glow('#b4fff8',20);ctx.beginPath();ctx.arc(player.x,player.y,7,0,Math.PI*2);ctx.fill();
      ctx.lineWidth=1.5;ctx.strokeStyle=dashing>0?'#fff':'#60ded6';ctx.beginPath();ctx.arc(player.x,player.y,dashing>0?20:14,0,Math.PI*2);ctx.stroke();
    }
    ctx.shadowBlur=0;
    if(state==='ready'){ctx.fillStyle='#6988b566';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('NEON RUSH / SURVIVAL ARENA',W/2,H-35);}
  }
  function frame(now){
    raf=0;if(state!=='running'||!visible)return;
    // Fixed substeps keep collision stable across 30 / 60 / 144 Hz displays.
    let remaining=last?Math.min((now-last)/1000,.05):0;last=now;
    while(remaining>0&&state==='running'){const step=Math.min(remaining,1/120);update(step);remaining-=step;}
    hud();draw();if(state==='running')raf=requestAnimationFrame(frame);
  }
  start.addEventListener('click',()=>{if(state==='paused')run();else reset();});
  q('reset').addEventListener('click',()=>reset(false));
  q('pause').addEventListener('click',()=>state==='paused'?run():pause());q('dash').addEventListener('click',()=>{dash();canvas.focus({preventScroll:true});});
  // Browsers may suppress click for a second finger while the first is dragging.
  q('dash').addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch')return;
    event.preventDefault();dash();canvas.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-dodge-level]').forEach(button=>button.addEventListener('click',()=>{
    if(state==='running'||state==='paused')return;
    level=button.dataset.dodgeLevel;root.querySelectorAll('[data-dodge-level]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));record();
    if(state==='over'){state='ready';showOverlay('READY FOR A NEW RUN',`${LEVELS[level].name}，准备好了。`,'移动青色光点躲避弹幕，空格冲刺。\n坚持 60 秒，解锁通关加分。','开始挑战 ↗');}draw();
  }));
  q('sound').addEventListener('click',()=>{sound=!sound;q('sound').textContent=`音效：${sound?'开':'关'}`;q('sound').setAttribute('aria-pressed',String(sound));if(sound)beep(520);});
  q('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await q('machine').requestFullscreen();}catch{q('status').textContent='当前浏览器暂不支持全屏，仍可在这里继续挑战。';}});
  document.addEventListener('fullscreenchange',()=>{q('fullscreen').textContent=document.fullscreenElement===q('machine')?'退出全屏 ↙':'全屏 ↗';});
  const point=event=>{const rect=canvas.getBoundingClientRect();return{x:clamp((event.clientX-rect.left)/rect.width*W,12,W-12),y:clamp((event.clientY-rect.top)/rect.height*H,12,H-12)};};
  canvas.addEventListener('pointerdown',event=>{if(state!=='running'||pointerId!==null||(event.pointerType==='mouse'&&event.button!==0))return;pointerId=event.pointerId;pointer=point(event);canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',event=>{if(state==='running'&&(event.pointerType==='mouse'||event.pointerId===pointerId))pointer=point(event);});
  const release=event=>{if(event.pointerId!==pointerId)return;if(canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);pointerId=null;if(event.pointerType!=='mouse')pointer=null;};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&pointerId===null)pointer=null;});
  window.addEventListener('keydown',event=>{
    if(!visible||event.ctrlKey||event.altKey||event.metaKey)return;
    const key=event.key.toLowerCase();
    if((key==='p'||key==='escape')&&['running','paused'].includes(state)){event.preventDefault();if(!event.repeat){state==='running'?pause():run();}return;}
    if(state!=='running'||document.activeElement!==canvas)return;
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){event.preventDefault();if(key===' '){if(!event.repeat)dash();}else keys.add(key);}
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>pause('窗口已离开，游戏自动暂停。点击继续后恢复。'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('页面进入后台，游戏自动暂停。点击继续后恢复。');});
  record();hud();draw();
  return{setVisible(value){visible=value;if(!visible)pause('已切换栏目，游戏自动暂停。点击继续后恢复。');else{hud();draw();}}};
}
