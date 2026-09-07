import * as THREE from '../../vendor/three.module.js';
import { FLOWERS } from './geometry.js?v=flowers-3';

// Evaluate the bent surface every GPU frame, rather than blending 3 poses.
const vertexShader = `
attribute vec2 petalUV;
uniform float progress, layer, layers, angle, widthScale, curl, twistAmount;
varying vec2 vUv; varying vec3 vView;
void main(){
  float u=petalUV.x, t=petalUV.y; vUv=vec2(u*.5+.5,t);
  float n=layer/(layers-1.);
  float k=clamp((progress-(.06+n*.48+sin(angle*4.)*.018))/.38,0.,1.);
  k=k*k*k*(k*(k*6.-15.)+10.);
  float radius=1.08-n*.40;
  float lengthT=t*(1.-.16*u*u);
  float arc=(2.95-k*(1.95-n*1.35))*lengthT;
  float reach=1.+k*(1.-n)*1.16;
  float r=sin(arc)*radius*reach+.028;
  float width=pow(max(0.,sin(3.14159*t*.88)),.75)*(.85-n*.35)*widthScale;
  float side=u*width;
  float ripple=sin(u*23.+t*16.+angle*3.)*curl*pow(abs(u),3.)*sin(3.14159*t);
  float lip=pow(t,7.)*(.048*sin(u*17.+angle*2.)+.027*sin(u*33.));
  float fold=.055*sin(u*9.+t*2.+angle)*sin(3.14159*t)*(.3+abs(u));
  float y=(1.-cos(arc))*radius-k*(1.-n)*.46*t+n*.18+ripple+lip+fold;
  float a=angle+twistAmount*t*n+k*twistAmount*.2+u*t*.09;
  vec3 p=vec3(cos(a)*r-sin(a)*side,y,sin(a)*r+cos(a)*side);
  vec4 mv=modelViewMatrix*vec4(p,1.);vView=mv.xyz;
  gl_Position=projectionMatrix*mv;
}`;
export function makeVeilPetals(progressUniform,kind='lotus') {
  const group=new THREE.Group(),config=FLOWERS[kind];
  const columns=48,rows=64;
  config.counts.forEach((count,layer)=>{
    for(let petal=0;petal<count;petal++){
      const angle=petal/count*Math.PI*2+layer*(kind==='rose'?2.39996:.49);
      const uniforms={progress:progressUniform,layer:{value:layer},layers:{value:config.counts.length},angle:{value:angle},widthScale:{value:config.width*(1+Math.sin(angle*5.1)*.07)},curl:{value:config.ripple*1.7},twistAmount:{value:config.twist},pinkColor:{value:new THREE.Color(...config.pink)}};
      const uv=[],positions=[],indices=[];
      for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){uv.push(col/columns*2-1,row/rows);positions.push(0,0,0);}
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('petalUV',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
      const material=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
        fragmentShader:`uniform vec3 pinkColor;uniform float layer,layers;varying vec2 vUv;varying vec3 vView;
        void main(){vec3 normal=normalize(cross(dFdx(vView),dFdy(vView)));float light=.65+.35*abs(dot(normal,normalize(vec3(-.4,.7,1.))));
          float rim=pow(1.-abs(dot(normal,normalize(-vView))),2.);
          float n=layer/(layers-1.);float border=pow(abs(vUv.x*2.-1.),22.)+smoothstep(.98,1.,vUv.y);
          float alpha=.022+n*.095+rim*.065+border*.10;
          vec3 color=mix(pinkColor,vec3(.99,.95,.95),.52+vUv.y*.20)*light;
          gl_FragColor=vec4(color,alpha);}`});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
      // Separate fine 3D strands stay visible when the petal is viewed edge-on.
      const lineUv=[],linePos=[];
      const add=(u,t)=>{lineUv.push(u,t);linePos.push(0,0,0);};
      for(let strand=0;strand<=64;strand++)for(let step=0;step<64;step++){
        const u=strand/64*2-1;
        add(u,step/64);add(u,(step+1)/64);
      }
      // Scalloped top margin and the two side seams.
      for(let step=0;step<96;step++){add(step/96*2-1,1);add((step+1)/96*2-1,1);}
      const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(linePos,3));lineGeometry.setAttribute('petalUV',new THREE.Float32BufferAttribute(lineUv,2));
      const lineMaterial=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,
        fragmentShader:`uniform float layer,layers;varying vec2 vUv;void main(){float edge=smoothstep(.96,1.,vUv.y);float n=layer/(layers-1.);gl_FragColor=vec4(vec3(.94,.82,.85),.085+n*.025+edge*.14);}`});
      const lines=new THREE.LineSegments(lineGeometry,lineMaterial);lines.frustumCulled=false;mesh.add(lines);
    }
  });
  return group;
}
