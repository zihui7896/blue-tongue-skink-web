import * as THREE from '../vendor/three.module.js';

// Artistic galaxy inspired by astronomical imagery, not a scientific star map.
export function createUniverse(root) {
  const canvas = root.querySelector('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 1.7));
  renderer.setClearColor(0x02030c);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 180);
  const galaxy = new THREE.Group();
  galaxy.rotation.set(-.87, .12, -.35);
  scene.add(galaxy);
  let seed = 9106;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.00001, random()))) * Math.cos(random() * Math.PI * 2);
  const timeUniform = { value: 0 };
  const tintUniform = { value: new THREE.Color('#8f83ff') };
  const pointVertex = `attribute float size; attribute float phase; varying vec3 vColor; varying float vPhase;
    void main(){vColor=color;vPhase=phase;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*360./max(.2,-p.z),1.,90.);}`;
  const pointFragment = `uniform float time; uniform float opacity; varying vec3 vColor; varying float vPhase;
    void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;if(r>1.)discard;
    float glow=exp(-r*r*7.)*.55+exp(-r*r*65.)*.8;
    float twinkle=.82+.18*sin(time*.65+vPhase);gl_FragColor=vec4(vColor,glow*twinkle*opacity);}`;
  function points(positions, colors, sizes, opacity = 1) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
    geometry.setAttribute('phase',new THREE.Float32BufferAttribute(sizes.map(() => random()*6.28),1));
    return new THREE.Points(geometry,new THREE.ShaderMaterial({
      uniforms:{time:timeUniform,opacity:{value:opacity}}, vertexShader:pointVertex,fragmentShader:pointFragment,
      vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
    }));
  }
  const count = mobile ? 26000 : 64000;
  const positions=[], colors=[], sizes=[], radii=[];
  const palette = { rose:['#ffe6c5','#8d9cff','#d774c5'], aurora:['#e2fbff','#4ebdff','#7d6aff'], gold:['#fff2d8','#e5b166','#b989c6'] };
  let theme='rose';
  function starColor(r, noise) {
    const p=palette[theme];
    return new THREE.Color(p[0]).lerp(new THREE.Color(noise>.72?p[2]:p[1]),Math.min(1,r/5.5));
  }
  for(let i=0;i<count;i++) {
    const core=random()<.25;
    const r=core?Math.pow(random(),1.7)*2.8:.5+Math.pow(random(),.7)*10;
    const arm=(i%4)*Math.PI/2;
    const angle=arm+r*.62+gaussian()*(.11+.38/(r+.4));
    const spread=gaussian()*(core?.55:.13+r*.021);
    positions.push(Math.cos(angle)*r+spread,Math.sin(angle)*r+spread,gaussian()*(core?.28:.07+r*.012));
    radii.push(r);const c=starColor(r,random());colors.push(c.r,c.g,c.b);
    sizes.push((.014+Math.pow(random(),5)*.15)*(core?.7:1));
  }
  const stars=points(positions,colors,sizes,.9);galaxy.add(stars);
  // Soft cloud particles follow the same spiral but occupy a wider volume.
  const cloudP=[],cloudC=[],cloudS=[];
  for(let i=0;i<1900;i++) {
    const r=.5+random()*9.6,a=(i%4)*Math.PI/2+r*.62+gaussian()*.16;
    cloudP.push(Math.cos(a)*r,Math.sin(a)*r,gaussian()*.14-.12);
    const c=starColor(r,random()).multiplyScalar(.35);cloudC.push(c.r,c.g,c.b);cloudS.push(.45+random()*1.3);
  }
  const clouds=points(cloudP,cloudC,cloudS,.055);galaxy.add(clouds);
  const nucleus=points([0,0,0,0,0,.05],[.9,.58,.3,1,.9,.76],[3.8,.8],.8);galaxy.add(nucleus);

  // A screen-space nebula gives the entire vista uneven, wispy depth.
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
    uniforms:{time:timeUniform,tint:tintUniform,aspect:{value:1}}, depthTest:false,depthWrite:false,
    vertexShader:`varying vec2 uvP;void main(){uvP=uv;gl_Position=vec4(position.xy,.999,1.);}`,
    fragmentShader:`varying vec2 uvP;uniform float time;uniform float aspect;uniform vec3 tint;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03+3.2;a*=.5;}return v;}
    void main(){vec2 p=(uvP-.5)*vec2(aspect,1.)*3.;p.x+=time*.003;
      float n=fbm(p*2.+vec2(fbm(p+4.),fbm(p-2.)));
      float band=exp(-pow((p.y+p.x*.32+sin(p.x*1.3)*.22)*1.9,2.));
      float wisps=pow(n,2.8)*band;vec3 col=vec3(.005,.008,.023)+tint*wisps*.44;
      col+=vec3(.12,.25,.5)*pow(fbm(p*3.-5.),4.)*.45;
      col*=.6+.4*(1.-smoothstep(.2,1.,length(uvP-.5)));gl_FragColor=vec4(col,1.);}`
  }));
  fog.frustumCulled=false;fog.renderOrder=-100;scene.add(fog);
  const skyP=[],skyC=[],skyS=[];
  for(let i=0;i<(mobile?1800:4200);i++){
    skyP.push((random()-.5)*95,(random()-.5)*70,-15-random()*55);
    const c=new THREE.Color().setHSL(.55+random()*.16,.12+random()*.3,.65+random()*.3);
    skyC.push(c.r,c.g,c.b);skyS.push(.025+Math.pow(random(),8)*.38);
  }
  const sky=points(skyP,skyC,skyS,.8);scene.add(sky);
  const burstP=new Float32Array(900),burstC=[],burstS=[],velocities=[];
  for(let i=0;i<300;i++){burstC.push(1,.65+random()*.35,.8+random()*.2);burstS.push(.045+random()*.12);velocities.push(new THREE.Vector3(gaussian(),gaussian(),gaussian()).normalize().multiplyScalar(1+random()*4));}
  const sparks=points(burstP,burstC,burstS);sparks.visible=false;scene.add(sparks);
  const streakP=new Float32Array(360*6),streaks=[];
  for(let i=0;i<360;i++)streaks.push({x:(random()-.5)*30,y:(random()-.5)*24,z:-random()*65});
  const streakGeo=new THREE.BufferGeometry();streakGeo.setAttribute('position',new THREE.BufferAttribute(streakP,3));
  const trails=new THREE.LineSegments(streakGeo,new THREE.LineBasicMaterial({color:'#b8caff',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  trails.frustumCulled=false;scene.add(trails);

  let active=false,paused=reduced.matches,frame=0,last=0,time=0,burstAge=9,travelAge=9,baseZ=19,targetZoom=1,zoom=1;
  let tx=.12,ty=-.87,drag=null,travelActive=false;
  const pause=root.querySelector('[data-pause-universe]');
  const travel=root.querySelector('[data-travel-universe]');
  const status=root.querySelector('[data-surprise-status]');
  const render=()=>renderer.render(scene,camera);
  function resize(){
    const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
    baseZ=width<600?28:width<1000?23:19;camera.position.z=baseZ*zoom;
    fog.material.uniforms.aspect.value=width/height;render();
  }
  new ResizeObserver(resize).observe(canvas);
  function tick(now){
    frame=0;if(!active||document.hidden)return;
    const dt=Math.min((now-last)/1000||0,.04);last=now;
    if(!paused){time+=dt;timeUniform.value=time;stars.rotation.z=time*.018;clouds.rotation.z=time*.018;sky.rotation.z=time*.0015;}
    galaxy.rotation.y+=(tx-galaxy.rotation.y)*.065;galaxy.rotation.x+=(ty-galaxy.rotation.x)*.065;
    zoom+=(targetZoom-zoom)*.055;
    if(travelActive&&!paused){
      travelAge+=dt;const amount=Math.pow(Math.sin(Math.min(1,travelAge/5.5)*Math.PI),2);
      camera.position.z=baseZ*zoom-amount*baseZ*.61;trails.material.opacity=amount*.7;
      for(let i=0;i<streaks.length;i++){const s=streaks[i];s.z+=dt*(12+amount*45);if(s.z>camera.position.z-1)s.z=-65;
        streakP.set([s.x,s.y,s.z,s.x,s.y,s.z-amount*5-.05],i*6);}
      streakGeo.attributes.position.needsUpdate=true;
      if(travelAge>=5.5){travelActive=false;travel.disabled=false;travel.textContent='穿越星河 ↗';trails.material.opacity=0;}
    }else if(!travelActive)camera.position.z=baseZ*zoom;
    if(sparks.visible){burstAge+=dt;const a=sparks.geometry.attributes.position;for(let i=0;i<300;i++){const v=velocities[i];a.setXYZ(i,v.x*burstAge,v.y*burstAge,v.z*burstAge);}a.needsUpdate=true;sparks.material.uniforms.opacity.value=Math.max(0,1-burstAge/2.6);sparks.visible=burstAge<2.6;}
    render();
    const settling=Math.abs(tx-galaxy.rotation.y)+Math.abs(ty-galaxy.rotation.x)+Math.abs(targetZoom-zoom)>.002;
    if(!paused||sparks.visible||settling)frame=requestAnimationFrame(tick);
  }
  function wake(){if(active&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
  function burst(x=0,y=0){burstAge=0;sparks.position.set(x,y,3);sparks.visible=true;wake();}
  function travelToGalaxy(){
    if(reduced.matches){burst();status.textContent='已开启减少动态效果，送你一束轻柔星光。';return;}
    if(paused){paused=false;syncPause();}
    travelAge=0;travelActive=true;travel.disabled=true;travel.textContent='正在穿越…';wake();
  }
  travel.addEventListener('click',travelToGalaxy);
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,tx,ty};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;tx=drag.tx+(e.clientX-drag.x)*.004;ty=THREE.MathUtils.clamp(drag.ty+(e.clientY-drag.y)*.004,-1.4,.1);wake();});
  canvas.addEventListener('pointerup',e=>{
    if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8){const r=canvas.getBoundingClientRect();const v=new THREE.Vector3((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1,.5).unproject(camera);const dir=v.sub(camera.position).normalize();const p=camera.position.clone().add(dir.multiplyScalar((3-camera.position.z)/dir.z));burst(p.x,p.y);}drag=null;
  });
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();targetZoom=THREE.MathUtils.clamp(targetZoom+e.deltaY*.0005,.58,1.4);wake();},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','+','-'].includes(e.key))return;e.preventDefault();
    if(e.key===' ')burst();else if(e.key==='+'||e.key==='-')targetZoom=THREE.MathUtils.clamp(targetZoom+(e.key==='+'?-.1:.1),.58,1.4);
    else {tx+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;ty=THREE.MathUtils.clamp(ty+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),-1.4,.1);}wake();
  });
  function syncPause(){pause.textContent=paused?'继续流动':'暂停流动';pause.setAttribute('aria-pressed',String(paused));}
  syncPause();pause.addEventListener('click',()=>{paused=!paused;syncPause();wake();});
  root.querySelectorAll('[data-universe-theme]').forEach(button=>button.addEventListener('click',()=>{
    theme=button.dataset.universeTheme;root.querySelectorAll('[data-universe-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    tintUniform.value.set(palette[theme][2]);const a=stars.geometry.attributes.color;
    for(let i=0;i<a.count;i++){const c=starColor(radii[i],(i%100)/100);a.setXYZ(i,c.r,c.g,c.b);}a.needsUpdate=true;
    const cloud=clouds.geometry.attributes.color;for(let i=0;i<cloud.count;i++){const c=starColor(Math.hypot(cloudP[i*3],cloudP[i*3+1]),(i%100)/100).multiplyScalar(.35);cloud.setXYZ(i,c.r,c.g,c.b);}cloud.needsUpdate=true;render();wake();
  }));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;cancelAnimationFrame(frame);frame=0;status.textContent='3D 场景已暂停，请刷新页面恢复。惊喜信笺仍可打开。';});
  resize();
  return {burst,setVisible(value){active=value;if(value){resize();wake();}else{cancelAnimationFrame(frame);frame=0;}}};
}
