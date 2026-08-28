const clamp=value=>Math.max(0,Math.min(1,value));
const easeOut=value=>1-Math.pow(1-clamp(value),3);
const easeInOut=value=>-(Math.cos(Math.PI*clamp(value))-1)/2;
const mix=(from,to,amount)=>from+(to-from)*amount;

export class BloomingFlowerEffect{
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d",{alpha:true});
    this.duration=8200;
    this.speed=1;
    this.startedAt=performance.now();
    this.visible=false;
    this.raf=0;
    this.image=new Image();
    this.image.decoding="async";
    this.image.src="assets/effects/blooming-flower/flower-3d-alpha.png";
    this.image.addEventListener("load",()=>this.draw(performance.now()));
    this.particles=this.createParticles(46);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }
  createParticles(count){
    let seed=20260828;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    return Array.from({length:count},(_,index)=>({
      x:random(),y:random(),depth:.35+random()*.95,size:4+random()*13,spin:(random()-.5)*1.5,phase:random()*Math.PI*2,speed:.018+random()*.045,hue:index%3
    }));
  }
  resize(){
    const bounds=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    this.width=Math.max(1,bounds.width);this.height=Math.max(1,bounds.height);
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw(performance.now());
  }
  setVisible(visible){
    this.visible=visible;
    if(visible&&!this.raf){this.startedAt=performance.now();this.raf=requestAnimationFrame(time=>this.frame(time))}
    if(!visible&&this.raf){cancelAnimationFrame(this.raf);this.raf=0}
  }
  setSpeed(speed){this.speed=Number(speed)||1}
  replay(){this.startedAt=performance.now();if(this.visible&&!this.raf)this.raf=requestAnimationFrame(time=>this.frame(time))}
  frame(time){this.raf=0;if(!this.visible)return;this.draw(time);this.raf=requestAnimationFrame(next=>this.frame(next))}
  draw(time){
    const ctx=this.ctx,w=this.width,h=this.height;if(!ctx||!w||!h)return;
    ctx.clearRect(0,0,w,h);
    const elapsed=(time-this.startedAt)*this.speed,bloom=easeInOut(elapsed/this.duration),afterBloom=clamp((elapsed-this.duration)/2400),breath=Math.sin(elapsed*.00125)*afterBloom;
    this.drawBackdrop(ctx,w,h,bloom);
    this.drawParticles(ctx,w,h,time,bloom,false);
    if(this.image.complete&&this.image.naturalWidth)this.drawFlower(ctx,w,h,bloom,breath);
    this.drawParticles(ctx,w,h,time,bloom,true);
  }
  drawBackdrop(ctx,w,h,bloom){
    const glow=ctx.createRadialGradient(w*.57,h*.48,0,w*.57,h*.48,Math.max(w,h)*.58);
    glow.addColorStop(0,`rgba(255,138,190,${.1+.09*bloom})`);glow.addColorStop(.34,"rgba(70,67,104,.11)");glow.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  }
  drawFlower(ctx,w,h,bloom,breath){
    const size=Math.min(w*.84,h*1.08),centerX=w*.58,centerY=h*.54,openX=mix(.16,1,easeOut(bloom)),openY=mix(.58,1,easeOut(bloom)),floatY=Math.sin(performance.now()*.0007)*2.2*bloom,rotation=mix(-.035,0,bloom)+breath*.006;
    ctx.save();ctx.translate(centerX,centerY+floatY);ctx.rotate(rotation);ctx.scale(openX*(1+breath*.008),openY*(1+breath*.012));
    ctx.globalAlpha=mix(.72,1,bloom);ctx.filter=`saturate(${mix(.92,1.08,bloom)}) brightness(${mix(.94,1.05,bloom)}) drop-shadow(0 20px 28px rgba(255,93,162,.22))`;
    ctx.drawImage(this.image,-size/2,-size/2,size,size);
    ctx.restore();
    const innerReveal=easeOut((bloom-.25)/.75);
    if(innerReveal>0){
      ctx.save();ctx.translate(centerX,centerY+floatY);ctx.rotate(rotation);ctx.globalCompositeOperation="screen";ctx.globalAlpha=.13*innerReveal;ctx.filter=`blur(${mix(6,1,innerReveal)}px) brightness(1.25)`;const highlightSize=size*(.91+.09*innerReveal);ctx.drawImage(this.image,-highlightSize/2,-highlightSize/2,highlightSize,highlightSize);ctx.restore();
    }
  }
  drawParticles(ctx,w,h,time,bloom,foreground){
    const palette=["rgba(255,151,194,","rgba(255,207,219,","rgba(193,123,185,"];
    for(const particle of this.particles){
      const isFront=particle.depth>.82;if(isFront!==foreground)continue;
      const cycle=(particle.y+time*.0001*particle.speed*60)%1,x=(particle.x+Math.sin(time*.00042+particle.phase)*.055+1)%1,y=cycle,size=particle.size*particle.depth*(.35+.65*bloom),alpha=(foreground?.34:.2)*(.25+.75*bloom)*(foreground?1:.72);
      ctx.save();ctx.translate(x*w,y*h);ctx.rotate(time*.00018*particle.spin+particle.phase);ctx.scale(1,.58);ctx.beginPath();ctx.moveTo(-size,0);ctx.bezierCurveTo(-size*.35,-size*.7,size*.4,-size*.65,size,0);ctx.bezierCurveTo(size*.28,size*.65,-size*.35,size*.6,-size,0);ctx.fillStyle=palette[particle.hue]+alpha+")";ctx.shadowColor="rgba(255,125,187,.62)";ctx.shadowBlur=foreground?13:7;ctx.fill();ctx.restore();
    }
  }
}
