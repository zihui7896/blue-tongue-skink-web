import * as THREE from '../vendor/three.module.js';

export function createUniverse(root) {
  const canvas = root.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.z = 11;
  const world = new THREE.Group();
  scene.add(world);
  const uniforms = { time: { value: 0 }, tint: { value: new THREE.Color('#ec9cc5') } };
  const material = new THREE.ShaderMaterial({ uniforms,
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal); vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float time; uniform vec3 tint; varying vec3 vNormal; varying vec3 vPosition;
    void main(){vec3 n=normalize(vNormal); float rim=pow(1.-max(n.z,0.),2.5); float bands=sin(vPosition.y*11.+sin(vPosition.x*4.+time*.17)*1.2+vPosition.z*3.); vec3 pearl=mix(vec3(.18,.13,.31),tint,.46+.16*bands); float light=max(dot(n,normalize(vec3(-.5,.8,1.))),0.); pearl*=.4+light*.8; pearl+=pow(max(dot(n,normalize(vec3(-.5,.65,1.))),0.),38.)*.6; pearl+=rim*vec3(.75,.45,.72); gl_FragColor=vec4(pearl,1.); }`
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), material);
  world.add(planet);
  const ring = new THREE.Group(); ring.rotation.set(.62, .1, -.32); world.add(ring);
  function random(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const rand = random(781);
  const pointVertex = `attribute float size; varying vec3 vColor; void main(){vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=min(24.,size*220./-mv.z); gl_Position=projectionMatrix*mv;}`;
  const pointFragment = `varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; float a=pow(1.-d,2.); gl_FragColor=vec4(vColor,a);}`;
  function points(positions, colors, sizes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
    const m = new THREE.ShaderMaterial({vertexShader:pointVertex,fragmentShader:pointFragment,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    return new THREE.Points(g,m);
  }
  const positions=[], colors=[], sizes=[];
  for(let i=0;i<8500;i++) {
    const angle=rand()*Math.PI*2, r=1.52+Math.pow(rand(),.7)*1.22;
    positions.push(Math.cos(angle)*r,Math.sin(angle)*r,(rand()-.5)*.065);
    const c=new THREE.Color().setHSL(.88+rand()*.12,.3+rand()*.35,.52+rand()*.32);
    colors.push(c.r,c.g,c.b); sizes.push(.018+rand()*.063);
  }
  const dust=points(positions,colors,sizes);ring.add(dust);
  for(const radius of [1.55,1.68,2.48,2.7]) {
    const line=new THREE.Mesh(new THREE.TorusGeometry(radius,.003,4,200),new THREE.MeshBasicMaterial({color:0xeeb9da,transparent:true,opacity:.24})); ring.add(line);
  }
  const starsP=[],starsC=[],starsS=[];
  for(let i=0;i<750;i++){starsP.push((rand()-.5)*23,(rand()-.5)*15,-3-rand()*8);const c=.35+rand()*.6;starsC.push(c,c*.8,c);starsS.push(.015+rand()*.06);}
  const stars=points(starsP,starsC,starsS);scene.add(stars);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.15,24,16),material);moon.position.set(3.1,0,0);world.add(moon);
  const burstP=new Float32Array(540),burstC=[],burstS=[],velocity=[];
  for(let i=0;i<180;i++){burstC.push(1,.6+rand()*.35,.82);burstS.push(.05+rand()*.09);velocity.push(new THREE.Vector3(rand()-.5,rand()-.5,rand()-.5).normalize().multiplyScalar(.8+rand()*2));}
  const sparks=points(burstP,burstC,burstS);sparks.visible=false;scene.add(sparks);
  let active=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,frame=0,last=0,time=0,burstAge=9,tx=0,ty=0,drag=null;
  const pause=root.querySelector('[data-pause-universe]');
  const render=()=>renderer.render(scene,camera);
  function resize(){const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();world.position.set(width>760?.65:0,width>760?0:-.05,0);world.scale.setScalar(width>760?1: .69);camera.position.z=width>760?10.3:12;render();}
  new ResizeObserver(resize).observe(canvas);
  function tick(now){frame=0;if(!active||document.hidden)return;const dt=Math.min((now-last)/1000||0,.04);last=now;
    if(!paused){time+=dt; uniforms.time.value=time;dust.rotation.z=time*.035;stars.rotation.z=time*.003;planet.rotation.y=time*.08;moon.position.set(Math.cos(time*.22)*3.1,Math.sin(time*.22)*1.3,Math.sin(time*.22)*2);}
    world.rotation.y+=(tx-world.rotation.y)*.06;world.rotation.x+=(ty-world.rotation.x)*.06;
    if(sparks.visible){burstAge+=dt;const a=sparks.geometry.attributes.position;for(let i=0;i<180;i++){const v=velocity[i];a.setXYZ(i,v.x*burstAge,v.y*burstAge,v.z*burstAge);}a.needsUpdate=true;sparks.material.opacity=1; sparks.visible=burstAge<2.4;}
    render();if(!paused||sparks.visible||Math.abs(tx-world.rotation.y)+Math.abs(ty-world.rotation.x)>.002)frame=requestAnimationFrame(tick);
  }
  function wake(){if(active&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
  function burst(x=0,y=0){burstAge=0;sparks.position.set(x,y,2);sparks.visible=true;wake();}
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,tx,ty};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;tx=drag.tx+(e.clientX-drag.x)*.006;ty=Math.max(-.7,Math.min(.7,drag.ty+(e.clientY-drag.y)*.004));wake();});
  canvas.addEventListener('pointerup',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8){const r=canvas.getBoundingClientRect();const v=new THREE.Vector3((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1,.5).unproject(camera);const direction=v.sub(camera.position).normalize();const p=camera.position.clone().add(direction.multiplyScalar((2-camera.position.z)/direction.z));burst(p.x,p.y);}drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key===' ')burst();else{tx+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;ty+=e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0;wake();}}});
  pause.textContent=paused?'继续流动':'暂停流动';pause.setAttribute('aria-pressed',String(paused));
  pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'继续流动':'暂停流动';pause.setAttribute('aria-pressed',String(paused));wake();});
  root.querySelectorAll('[data-universe-theme]').forEach(button=>button.addEventListener('click',()=>{
    root.querySelectorAll('[data-universe-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const themes={rose:['#ec9cc5',.91],aurora:['#74dce8',.54],gold:['#edc88d',.1]};const [color,hue]=themes[button.dataset.universeTheme];uniforms.tint.value.set(color);
    const attr=dust.geometry.attributes.color;for(let i=0;i<attr.count;i++){const c=new THREE.Color().setHSL(hue+(i%11)*.005,.45,.55+(i%7)*.045);attr.setXYZ(i,c.r,c.g,c.b);}attr.needsUpdate=true;render();wake();
  }));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;cancelAnimationFrame(frame);frame=0;root.querySelector('[data-surprise-status]').textContent='3D 场景已暂停，请刷新页面恢复。惊喜信笺仍可打开。';});
  resize();
  return {burst,setVisible(value){active=value;if(value){resize();wake();}else{cancelAnimationFrame(frame);frame=0;}}};
}
