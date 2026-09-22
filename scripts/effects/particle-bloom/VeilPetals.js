import * as THREE from '../../vendor/three.module.js';
import { FLOWERS } from './geometry.js?v=flowers-18';

// Evaluate the bent surface every GPU frame, rather than blending 3 poses.
const vertexShader = `
attribute vec2 petalUV;
uniform float progress, layer, layers, angle, widthScale, curl, twistAmount, spread, shapeMode;
varying vec2 vUv; varying vec3 vView;
void main(){
  float u=petalUV.x, t=petalUV.y; vUv=vec2(u*.5+.5,t);
  float n=layer/(layers-1.);
  float k=clamp((progress-(.06+n*.48+sin(angle*4.)*.018))/.38,0.,1.);
  k=k*k*k*(k*(k*6.-15.)+10.);
  float variation=sin(angle*7.3+layer*2.1);
  float shell=smoothstep(.25,.5,n);
  float radius=(1.24-n*.78)*(1.+variation*.09);
  float lengthT=t*(1.-.20*u*u+.018*sin(u*5.+angle));
  // The reference flower opens into a broad, low cup. Keep the bud tight at
  // the start, then let the inner whorls travel farther than the gauze rim.
  float openArc=mix(1.45,2.18+n*.34,shell);
  // The reference bloom is a low, wide cup. Peony gets the same broad falloff
  // while rose/lotus retain their taller silhouettes.
  openArc=mix(openArc,1.28+n*.95,shapeMode);
  float arc=mix(3.08,openArc,k)*lengthT;
  float reach=1.+k*(1.-n)*spread*.48;
  float r=sin(arc)*radius*reach+.028;
  float width=pow(max(0.,sin(3.14159*t*.86)),.42)*(.94-n*.12)*widthScale;
  float ripple=sin(u*17.+t*8.+angle*3.)*curl*pow(abs(u),2.)*sin(3.14159*t);
  float lip=pow(t,8.)*(.024*sin(u*8.+angle*2.)+.010*sin(u*21.+angle));
  float fold=.035*sin(u*10.+t*3.+angle)*sin(3.14159*t)*(.3+abs(u));
  float y=(1.-cos(arc))*radius-k*(1.-shell)*.20*t+n*.08+ripple+lip+fold+u*u*width*.12*sin(3.14159*t*.85);
  float a=angle+twistAmount*t*n+k*twistAmount*.2+u*width;
  vec3 p=vec3(cos(a)*r,y,sin(a)*r);
  vec4 mv=modelViewMatrix*vec4(p,1.);vView=mv.xyz;
  gl_Position=projectionMatrix*mv;
}`;
export function makeVeilPetals(progressUniform,kind='lotus') {
  const group=new THREE.Group(),config=FLOWERS[kind];
  const columns=48,rows=64;
  config.counts.forEach((count,layer)=>{
    for(let petal=0;petal<count;petal++){
      const angle=petal/count*Math.PI*2+layer*2.39996+Math.sin(petal*13.7+layer*3.1)*.14;
      const uniforms={progress:progressUniform,layer:{value:layer},layers:{value:config.counts.length},angle:{value:angle},widthScale:{value:config.width*(1+Math.sin(angle*5.1)*.07)},curl:{value:config.ripple*1.7},twistAmount:{value:config.twist},spread:{value:config.spread*.64},shapeMode:{value:kind==='peony'?1:kind==='rose'?.82:0},petalColor:{value:new THREE.Color(...config.color)}};
      const uv=[],positions=[],indices=[];
      for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){uv.push(col/columns*2-1,row/rows);positions.push(0,0,0);}
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('petalUV',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
      // Inner petals occlude one another; only the outer whorls are gauze.
      const material=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
        fragmentShader:`uniform vec3 petalColor;uniform float layer,layers;varying vec2 vUv;varying vec3 vView;
        void main(){if(vUv.y<.035)discard;vec3 normal=normalize(cross(dFdx(vView),dFdy(vView)));float light=.70+.30*abs(dot(normal,normalize(vec3(-.4,.7,1.))));
          float rim=pow(1.-abs(dot(normal,normalize(-vView))),2.);
          float n=layer/(layers-1.);float border=pow(abs(vUv.x*2.-1.),22.)+smoothstep(.98,1.,vUv.y);
          // Inner cup petals carry the colour; the outer gauze rim stays light.
          float alpha=(mix(.035,.22,n)+rim*.05+border*.06)*smoothstep(.025,.22,vUv.y);
          float crease=.965+.035*sin(vUv.x*30.+vUv.y*7.);
          vec3 color=mix(petalColor,vec3(.98,.99,1.),.46+vUv.y*.14)*light*crease;
          gl_FragColor=vec4(color,alpha);}`});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
      // Separate fine 3D strands stay visible when the petal is viewed edge-on.
      const lineUv=[],linePos=[];
      const add=(u,t)=>{lineUv.push(u,t);linePos.push(0,0,0);};
      for(let strand=0;strand<=96;strand++)for(let step=0;step<64;step++){
        const u=strand/96*2-1;
        add(u,step/64);add(u,(step+1)/64);
      }
      // Scalloped top margin and the two side seams.
      for(let step=0;step<96;step++){add(step/96*2-1,1);add((step+1)/96*2-1,1);}
      const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(linePos,3));lineGeometry.setAttribute('petalUV',new THREE.Float32BufferAttribute(lineUv,2));
      const lineMaterial=new THREE.ShaderMaterial({uniforms,vertexShader,transparent:true,depthWrite:false,
        fragmentShader:`uniform vec3 petalColor;uniform float layer,layers;varying vec2 vUv;void main(){float edge=smoothstep(.985,1.,vUv.y);float n=layer/(layers-1.);vec3 c=mix(petalColor,vec3(.94,.94,1.),.65);gl_FragColor=vec4(c,(mix(.095,.06,n)+edge*.14)*smoothstep(.08,.3,vUv.y));}`});
      const lines=new THREE.LineSegments(lineGeometry,lineMaterial);lines.frustumCulled=false;mesh.add(lines);
    }
  });
  return group;
}
