const clamp=value=>Math.max(0,Math.min(1,value));
const mix=(from,to,amount)=>from+(to-from)*amount;
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t)};
const easeOut=value=>1-Math.pow(1-clamp(value),3);

/**
 * A flower-image mesh renderer.
 *
 * The source flower remains one coherent 3D object. A low-resolution triangle
 * mesh bends different whorls at slightly different times, so petals hinge and
 * relax without cloning one sprite into a radial fan.
 */
export class PetalBloomEffect{
  constructor(canvas,config){
    this.canvas=canvas;
    this.config=config;
    this.ctx=canvas.getContext("2d",{alpha:true});
    this.surface=document.createElement("canvas");
    this.surfaceCtx=this.surface.getContext("2d",{alpha:true});
    this.duration=config.duration;
    this.speed=1;
    this.startedAt=performance.now();
    this.visible=false;
    this.raf=0;
    this.flowerImage=this.loadImage(config.flowerImage);
    this.budImage=config.budImage?this.loadImage(config.budImage):null;
    const petalSources=config.petalImages||[config.petalImage||"assets/effects/shared/sakura-petal-v1.png"];
    this.petalImages=petalSources.map(src=>this.loadImage(src));
    this.particles=this.createParticles(config.particleCount||30);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  loadImage(src){
    const image=new Image();
    image.decoding="async";
    image.src=src;
    image.addEventListener("load",()=>this.draw(performance.now()));
    return image;
  }

  createParticles(count){
    let seed=this.config.seed+97;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    return Array.from({length:count},(_,index)=>({
      x:random(),y:random(),depth:.35+random()*.75,size:9+random()*18,
      spin:(random()-.5)*1.8,phase:random()*Math.PI*2,
      speed:.04+random()*.045,drift:(random()-.5)*.11,index
    }));
  }

  resize(){
    const bounds=this.canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    this.width=Math.max(1,bounds.width);
    this.height=Math.max(1,bounds.height);
    this.dpr=dpr;
    this.canvas.width=Math.round(this.width*dpr);
    this.canvas.height=Math.round(this.height*dpr);
    this.surface.width=Math.ceil(this.width);
    this.surface.height=Math.ceil(this.height);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.draw(performance.now());
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
    const ctx=this.ctx,w=this.width,h=this.height;
    if(!ctx||!w||!h)return;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const elapsed=(time-this.startedAt)*this.speed;
    const progress=clamp(elapsed/this.duration);
    const afterBloom=clamp((elapsed-this.duration)/2200);
    const breath=Math.sin(elapsed*.0012)*afterBloom;
    if(this.config.backdrop!==false)this.drawBackdrop(ctx,w,h,progress);
    this.drawParticles(ctx,w,h,time,progress,false);
    if(this.flowerImage.complete&&this.flowerImage.naturalWidth){
      this.drawFlowerMesh(ctx,w,h,progress,breath);
    }
    this.drawParticles(ctx,w,h,time,progress,true);
  }

  drawBackdrop(ctx,w,h,progress){
    const {center,palette}=this.config;
    const glow=ctx.createRadialGradient(w*center.x,h*center.y,0,w*center.x,h*center.y,Math.max(w,h)*.64);
    glow.addColorStop(0,`${palette.glow}${.08+.14*progress})`);
    glow.addColorStop(.4,palette.mid);
    glow.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(0,0,w,h);
  }

  drawFlowerMesh(ctx,w,h,progress,breath){
    const surface=this.surfaceCtx;
    surface.setTransform(1,0,0,1,0,0);
    surface.clearRect(0,0,w,h);
    surface.imageSmoothingEnabled=true;
    surface.imageSmoothingQuality="high";

    const focus=smooth(progress/.115);
    const bloom=smooth((progress-.075)/.81);
    const introScale=mix(.93,1,easeOut(progress/.24));
    const size=Math.min(w*this.config.finalSize.x,h*this.config.finalSize.y)*introScale;
    const cx=w*this.config.center.x+mix(-w*.018,0,easeOut(progress/.42));
    const cy=h*this.config.center.y+mix(h*.015,0,easeOut(progress/.42));
    const rotation=mix(this.config.openingRotation,this.config.finalRotation,smooth(progress/.86))+breath*.005;
    const columns=this.config.mesh.columns;
    const rows=this.config.mesh.rows;
    const vertices=[];

    for(let row=0;row<=rows;row++){
      const line=[];
      for(let column=0;column<=columns;column++){
        line.push(this.mapVertex(column/columns,row/rows,size,cx,cy,rotation,bloom,breath));
      }
      vertices.push(line);
    }

    const image=this.flowerImage;
    const sourceWidth=image.naturalWidth;
    const sourceHeight=image.naturalHeight;
    for(let row=0;row<rows;row++){
      for(let column=0;column<columns;column++){
        const sx0=column/columns*sourceWidth;
        const sx1=(column+1)/columns*sourceWidth;
        const sy0=row/rows*sourceHeight;
        const sy1=(row+1)/rows*sourceHeight;
        const a=vertices[row][column];
        const b=vertices[row][column+1];
        const c=vertices[row+1][column+1];
        const d=vertices[row+1][column];
        this.drawTriangle(surface,image,[sx0,sy0,sx1,sy0,sx1,sy1],[a.x,a.y,b.x,b.y,c.x,c.y]);
        this.drawTriangle(surface,image,[sx0,sy0,sx1,sy1,sx0,sy1],[a.x,a.y,c.x,c.y,d.x,d.y]);
      }
    }

    const opacity=mix(.5,1,smooth(progress/.1));
    const meshReveal=smooth((progress-.16)/.1);
    const grade=this.config.grade;

    // Start from one rounded, coherent flower body. The opening frame stays
    // softly defocused while the petal mesh fades in underneath it, preventing
    // the triangular grid from becoming the first thing the eye sees.
    const finalSize=Math.min(w*this.config.finalSize.x,h*this.config.finalSize.y);
    const budScale=mix(1.02,.93,meshReveal);
    const budImage=this.budImage?.complete&&this.budImage.naturalWidth?this.budImage:image;
    ctx.save();
    ctx.translate(cx,cy+meshReveal*finalSize*.035);
    ctx.rotate(this.config.openingRotation);
    ctx.scale(mix(.96,1,easeOut(progress/.22)),mix(.97,1,easeOut(progress/.22)));
    ctx.globalAlpha=opacity*mix(1,.08,meshReveal);
    ctx.filter=`blur(${mix(15,1.2,focus).toFixed(2)}px) saturate(${mix(.56,grade.saturation,focus)}) brightness(${mix(.94,grade.brightness,focus)}) contrast(${grade.contrast}) hue-rotate(${grade.hue}deg) drop-shadow(0 18px 28px ${this.config.palette.shadow})`;
    ctx.drawImage(budImage,-finalSize*budScale/2,-finalSize*budScale/2,finalSize*budScale,finalSize*budScale);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha=opacity*meshReveal;
    ctx.filter=`blur(${mix(11,0,focus).toFixed(2)}px) saturate(${mix(.58,grade.saturation,focus)}) brightness(${mix(.94,grade.brightness,focus)}) contrast(${grade.contrast}) hue-rotate(${grade.hue}deg) drop-shadow(0 20px 30px ${this.config.palette.shadow})`;
    ctx.drawImage(this.surface,0,0,w,h);
    ctx.restore();

    // The last few percent settles into the untouched source pixels, removing
    // mesh seams while retaining the preceding independent-whorl movement.
    const settle=smooth((progress-.9)/.1);
    if(settle>0){
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(this.config.finalRotation+breath*.005);
      ctx.globalAlpha=settle;
      ctx.filter=`saturate(${grade.saturation}) brightness(${grade.brightness}) contrast(${grade.contrast}) hue-rotate(${grade.hue}deg) drop-shadow(0 20px 30px ${this.config.palette.shadow})`;
      ctx.drawImage(image,-finalSize/2,-finalSize/2,finalSize,finalSize);
      ctx.restore();
    }
  }

  mapVertex(u,v,size,cx,cy,rotation,bloom,breath){
    const mesh=this.config.mesh;
    const dx=u-mesh.flowerCenter.x;
    const dy=v-mesh.flowerCenter.y;
    const radius=clamp(Math.hypot(dx,dy*1.04)/.58);
    const angle=Math.atan2(dy,dx);
    const head=smooth((mesh.stemStart-v)/.12);
    const outer=smooth((radius-.18)/.78)*head;

    // The outer glass petals hinge first. Dense inner petals follow later.
    // Angular waves keep neighboring whorls from moving in lock-step.
    const angularDelay=(Math.sin(angle*5+mesh.phase)+Math.sin(angle*9-mesh.phase)*.45)*.018;
    const delay=.02+(1-radius)*mesh.innerDelay+angularDelay;
    const local=smooth((bloom-delay)/(1-delay));

    const closedX=mix(mesh.innerCompression,mesh.outerCompression,radius);
    const bottom=clamp((dy+.02)/.42);
    const closedY=mix(.9,mesh.bottomCompression,bottom*outer);
    let mappedX=mesh.flowerCenter.x+dx*mix(closedX,1,local);
    let mappedY=mesh.flowerCenter.y+dy*mix(closedY,1,local);

    // A restrained radial overshoot reads as petal tips curling away from the
    // receptacle; it peaks mid-bloom and returns exactly to the final asset.
    const curl=Math.sin(local*Math.PI)*outer*mesh.curl;
    mappedX+=Math.cos(angle)*curl;
    mappedY+=Math.sin(angle)*curl*.72-bottom*curl*.25;

    // Keep the stem anchored while the head opens above it.
    const stem=smooth((v-mesh.stemStart)/.1)*(1-smooth(Math.abs(dx)/.18));
    mappedX=mix(mappedX,u,stem);
    mappedY=mix(mappedY,v,stem);

    const finalSize=Math.min(this.width*this.config.finalSize.x,this.height*this.config.finalSize.y);
    const scale=mix(size,finalSize*(1+breath*.01),local*.04);
    const x=(mappedX-.5)*scale;
    const y=(mappedY-.5)*scale;
    const cos=Math.cos(rotation),sin=Math.sin(rotation);
    return{x:cx+x*cos-y*sin,y:cy+x*sin+y*cos};
  }

  drawTriangle(ctx,image,source,destination){
    const [sx0,sy0,sx1,sy1,sx2,sy2]=source;
    const [dx0,dy0,dx1,dy1,dx2,dy2]=destination;
    const denominator=sx0*(sy1-sy2)+sx1*(sy2-sy0)+sx2*(sy0-sy1);
    if(Math.abs(denominator)<.00001)return;
    const a=(dx0*(sy1-sy2)+dx1*(sy2-sy0)+dx2*(sy0-sy1))/denominator;
    const c=(dx0*(sx2-sx1)+dx1*(sx0-sx2)+dx2*(sx1-sx0))/denominator;
    const e=(dx0*(sx1*sy2-sx2*sy1)+dx1*(sx2*sy0-sx0*sy2)+dx2*(sx0*sy1-sx1*sy0))/denominator;
    const b=(dy0*(sy1-sy2)+dy1*(sy2-sy0)+dy2*(sy0-sy1))/denominator;
    const d=(dy0*(sx2-sx1)+dy1*(sx0-sx2)+dy2*(sx1-sx0))/denominator;
    const f=(dy0*(sx1*sy2-sx2*sy1)+dy1*(sx2*sy0-sx0*sy2)+dy2*(sx0*sy1-sx1*sy0))/denominator;
    const centroidX=(dx0+dx1+dx2)/3;
    const centroidY=(dy0+dy1+dy2)/3;
    const expand=(x,y)=>({x:centroidX+(x-centroidX)*1.045,y:centroidY+(y-centroidY)*1.045});
    const p0=expand(dx0,dy0),p1=expand(dx1,dy1),p2=expand(dx2,dy2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.closePath();
    ctx.clip();
    ctx.setTransform(a,b,c,d,e,f);
    ctx.drawImage(image,0,0);
    ctx.restore();
  }

  drawParticles(ctx,w,h,time,progress,foreground){
    for(const particle of this.particles){
      const image=this.petalImages[particle.index%this.petalImages.length];
      if(!image?.complete||!image.naturalWidth)continue;
      const isFront=particle.depth>.82;
      if(isFront!==foreground)continue;
      const cycle=(particle.y+time*.001*particle.speed)%1;
      const sway=Math.sin(time*.00062+particle.phase)*(.035+.025*particle.depth);
      const x=(particle.x+sway+cycle*particle.drift+1)%1;
      const size=particle.size*particle.depth;
      const flutter=.52+Math.abs(Math.sin(time*.0011+particle.phase))*.48;
      const alpha=foreground?.72:.4;
      ctx.save();
      ctx.translate(x*w,(cycle*1.16-.08)*h);
      ctx.rotate(time*.00032*particle.spin+particle.phase+Math.sin(time*.0008+particle.phase)*.32);
      ctx.scale(1,flutter);
      ctx.globalAlpha=alpha;
      ctx.filter=foreground?"none":"blur(.7px)";
      ctx.shadowColor=this.config.palette.particleGlow;
      ctx.shadowBlur=foreground?8:3;
      ctx.drawImage(image,-size,-size,size*2,size*2);
      ctx.restore();
    }
  }
}
