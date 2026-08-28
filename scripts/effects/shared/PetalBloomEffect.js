const clamp=value=>Math.max(0,Math.min(1,value));
const mix=(from,to,amount)=>from+(to-from)*amount;
const easeOut=value=>1-Math.pow(1-clamp(value),3);
const easeInOut=value=>-(Math.cos(Math.PI*clamp(value))-1)/2;

export class PetalBloomEffect{
  constructor(canvas,config){
    this.canvas=canvas;this.config=config;this.ctx=canvas.getContext("2d",{alpha:true});this.duration=config.duration;this.speed=1;this.startedAt=performance.now();this.visible=false;this.raf=0;
    this.flowerImage=this.loadImage(config.flowerImage);this.petalImage=this.loadImage(config.petalImage);this.petals=this.createPetals(config.layers);this.particles=this.createParticles(44);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();
  }
  loadImage(src){const image=new Image();image.decoding="async";image.src=src;image.addEventListener("load",()=>this.draw(performance.now()));return image}
  createPetals(layers){
    let seed=this.config.seed;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    return layers.flatMap((layer,layerIndex)=>Array.from({length:layer.count},(_,index)=>({layerIndex,index,count:layer.count,radius:layer.radius*(.9+random()*.2),width:layer.width*(.88+random()*.22),height:layer.height*(.9+random()*.18),delay:clamp(layer.delay+(random()-.5)*layer.stagger),twist:layer.twist*(.75+random()*.5)*(index%2?1:-1),tilt:(random()-.5)*.12,alpha:.82+random()*.18,hue:(random()-.5)*12,phase:random()*Math.PI*2})));
  }
  createParticles(count){
    let seed=this.config.seed+97;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    return Array.from({length:count},(_,index)=>({x:random(),y:random(),depth:.35+random(),size:3+random()*10,spin:(random()-.5)*1.4,phase:random()*Math.PI*2,speed:.018+random()*.04,hue:index%3}));
  }
  resize(){const bounds=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.width=Math.max(1,bounds.width);this.height=Math.max(1,bounds.height);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw(performance.now())}
  setVisible(visible){this.visible=visible;if(visible&&!this.raf){this.startedAt=performance.now();this.raf=requestAnimationFrame(time=>this.frame(time))}if(!visible&&this.raf){cancelAnimationFrame(this.raf);this.raf=0}}
  setSpeed(speed){this.speed=Number(speed)||1}
  replay(){this.startedAt=performance.now();if(this.visible&&!this.raf)this.raf=requestAnimationFrame(time=>this.frame(time))}
  frame(time){this.raf=0;if(!this.visible)return;this.draw(time);this.raf=requestAnimationFrame(next=>this.frame(next))}
  draw(time){
    const ctx=this.ctx,w=this.width,h=this.height;if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);
    const elapsed=(time-this.startedAt)*this.speed,progress=clamp(elapsed/this.duration),afterBloom=clamp((elapsed-this.duration)/2200),breath=Math.sin(elapsed*.00125)*afterBloom;
    this.drawBackdrop(ctx,w,h,progress);this.drawParticles(ctx,w,h,time,progress,false);if(this.petalImage.complete&&this.petalImage.naturalWidth)this.drawPetals(ctx,w,h,progress,breath);if(this.flowerImage.complete&&this.flowerImage.naturalWidth)this.drawFinalFlower(ctx,w,h,progress,breath);this.drawParticles(ctx,w,h,time,progress,true);
  }
  drawBackdrop(ctx,w,h,progress){const {center,palette}=this.config,glow=ctx.createRadialGradient(w*center.x,h*center.y,0,w*center.x,h*center.y,Math.max(w,h)*.62);glow.addColorStop(0,`${palette.glow}${.1+.13*progress})`);glow.addColorStop(.38,palette.mid);glow.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h)}
  drawPetals(ctx,w,h,progress,breath){
    const base=Math.min(w,h),cx=w*this.config.center.x,cy=h*this.config.center.y,layerCount=this.config.layers.length,spriteFade=1-easeInOut((progress-.78)/.2);
    for(const petal of this.petals){
      const layer=this.config.layers[petal.layerIndex],local=easeInOut((progress-petal.delay)/(1-petal.delay)),angle=petal.index/petal.count*Math.PI*2+layer.phase,open=easeOut(local),radial=base*petal.radius*open;
      const width=base*petal.width*mix(.44,1,open),height=base*petal.height*mix(.28,1,open),twist=petal.twist*(1-open),layerDepth=1-petal.layerIndex/Math.max(1,layerCount-1);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(angle+twist+petal.tilt*open);ctx.translate(0,-radial);ctx.scale(1+breath*.008*layerDepth,1+breath*.012*layerDepth);ctx.globalAlpha=petal.alpha*mix(.72,1,open)*spriteFade;ctx.filter=`hue-rotate(${petal.hue}deg) saturate(${mix(.86,1.06,open)}) brightness(${mix(.88,1.04,open)}) drop-shadow(0 10px 12px ${this.config.palette.shadow})`;ctx.drawImage(this.petalImage,-width/2,-height,width,height);ctx.restore();
    }
  }
  drawFinalFlower(ctx,w,h,progress,breath){
    const reveal=easeInOut((progress-.68)/.28);if(reveal<=0)return;const size=Math.min(w*this.config.finalSize.x,h*this.config.finalSize.y),cx=w*this.config.center.x,cy=h*this.config.center.y,floatY=Math.sin(performance.now()*.0007)*2.2*progress;
    ctx.save();ctx.translate(cx,cy+floatY);ctx.rotate(this.config.finalRotation+breath*.006);ctx.scale(1+breath*.008,1+breath*.012);ctx.globalAlpha=reveal;ctx.filter=`saturate(${mix(.96,1.07,reveal)}) brightness(${mix(.96,1.04,reveal)}) drop-shadow(0 20px 28px ${this.config.palette.shadow})`;ctx.drawImage(this.flowerImage,-size/2,-size/2,size,size);ctx.restore();
  }
  drawParticles(ctx,w,h,time,progress,foreground){
    const palette=this.config.palette.particles;for(const particle of this.particles){const isFront=particle.depth>.82;if(isFront!==foreground)continue;const cycle=(particle.y+time*.0001*particle.speed*60)%1,x=(particle.x+Math.sin(time*.00042+particle.phase)*.045+1)%1,y=cycle,size=particle.size*particle.depth*(.28+.72*progress),alpha=(foreground?.3:.17)*(.18+.82*progress);ctx.save();ctx.translate(x*w,y*h);ctx.rotate(time*.00018*particle.spin+particle.phase);ctx.scale(1,.56);ctx.beginPath();ctx.moveTo(-size,0);ctx.bezierCurveTo(-size*.35,-size*.7,size*.4,-size*.65,size,0);ctx.bezierCurveTo(size*.28,size*.65,-size*.35,size*.6,-size,0);ctx.fillStyle=palette[particle.hue]+alpha+")";ctx.shadowColor=this.config.palette.particleGlow;ctx.shadowBlur=foreground?12:6;ctx.fill();ctx.restore()}
  }
}
