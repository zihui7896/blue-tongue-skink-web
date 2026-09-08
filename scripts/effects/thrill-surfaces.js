import * as T from '../vendor/three.module.js';

const fract = x => x - Math.floor(x);
const hash = (x,y) => fract(Math.sin(x*127.1+y*311.7)*43758.5453);
export function noise(x,y) {
  const ix=Math.floor(x), iy=Math.floor(y), fx=fract(x), fy=fract(y);
  const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);
}
export function fbm(x,y) { return noise(x,y)*.52+noise(x*2.03,y*2.03)*.27+noise(x*4.09,y*4.09)*.14+noise(x*8.17,y*8.17)*.07; }

export function makeSurfaces(renderer) {
  const textures=[];
  function texture(width,height,pixel,repeat=false) {
    const data=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const c=pixel(x/width,y/height);
      const i=(y*width+x)*4;
      data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=255;
    }
    const tex=new T.DataTexture(data,width,height,T.RGBAFormat);
    tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;
    if(repeat)tex.wrapS=tex.wrapT=T.RepeatWrapping;
    tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());tex.needsUpdate=true;textures.push(tex);return tex;
  }
  const rock=texture(256,512,(x,y)=>{
    const n=fbm(x*18,y*15), seams=Math.pow(noise(x*35,y*3),9), strata=Math.sin(y*360+noise(x*7,y*8)*12)*.08;
    const value=.5+n*.55+strata-seams*.35;
    return [133*value,139*value,127*value];
  },true);
  const soil=texture(256,256,(x,y)=>{const n=fbm(x*35,y*35), grain=hash(x*256,y*256)*.18;return [77*(n+.7+grain),89*(n+.7+grain),56*(n+.7+grain)];},true);
  soil.repeat.set(100,100);
  const bark=texture(128,256,(x,y)=>{const n=fbm(x*38,y*4);return [105*n+25,88*n+23,64*n+19];},true);
  const sky=texture(512,256,(x,y)=>{
    const elevation=Math.sin((y-.5)*Math.PI), horizon=Math.pow(1-Math.max(0,elevation),3);
    const base=[51+145*horizon,112+92*horizon,165+50*horizon];
    const cloud=T.MathUtils.smoothstep(fbm(x*14,y*24),.53,.75)*T.MathUtils.smoothstep(elevation,0,.17)*.83;
    const sx=Math.min(Math.abs(x-.23),1-Math.abs(x-.23));
    const glow=Math.exp(-(sx*sx+Math.pow(y-.72,2))*700);
    return base.map((c,i)=>T.MathUtils.lerp(c,[232,235,231][i],cloud)+glow*80);
  });
  sky.mapping=T.EquirectangularReflectionMapping;
  const generator=new T.PMREMGenerator(renderer), environment=generator.fromEquirectangular(sky);generator.dispose();
  return {rock,soil,bark,sky,environment,textures};
}

// Fixed-step spring integration is precomputed, so pause/replay and seeking produce identical motion.
export function bungeeMotion() {
  const step=1/240, samples=[];let distance=0,velocity=0;
  for(let t=0;t<=22;t+=step){
    samples.push({distance,velocity});
    const extension=Math.max(0,distance-62);
    const tension=extension>0?1.05*extension+Math.max(-8,velocity*.36):0;
    velocity+=(9.81-tension)*step;distance+=velocity*step;
  }
  return t=>{
    const index=T.MathUtils.clamp(t/step,0,samples.length-2), i=Math.floor(index), f=index-i;
    return {distance:T.MathUtils.lerp(samples[i].distance,samples[i+1].distance,f),velocity:T.MathUtils.lerp(samples[i].velocity,samples[i+1].velocity,f)};
  };
}
