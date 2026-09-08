import * as T from '../vendor/three.module.js';
import { makeSurfaces, fbm, noise, bungeeMotion } from './thrill-surfaces.js?v=3';

const clamp = T.MathUtils.clamp;
const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
const v = (x, y, z) => new T.Vector3(x, y, z);
const up = v(0, 1, 0);
// Fixed seed keeps the valley stable between replays.
function random(seed = 417) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

export class ThrillWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.surfaces=makeSurfaces(this.renderer);
    this.bungeeSample=bungeeMotion();
    this.camera = new T.PerspectiveCamera(76, 1, .08, 2400);
    this.base = new T.Quaternion(); this.offset = new T.Quaternion();
    this.resize();
  }
  resize() {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
  material(color, extra = {}) { return new T.MeshStandardMaterial({ color, roughness: .85, ...extra }); }
  mesh(geometry, material, position, scale, parent = this.world) {
    const item = new T.Mesh(geometry, material);
    item.castShadow=!material.transparent;item.receiveShadow=true;
    if (position) item.position.copy(position);
    if (scale) item.scale.copy(scale);
    parent.add(item); return item;
  }
  beam(a, b, radius, material, parent = this.world) {
    const mesh = this.mesh(new T.CylinderGeometry(radius, radius, a.distanceTo(b), 6), material, a.clone().add(b).multiplyScalar(.5), null, parent);
    mesh.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize()); return mesh;
  }
  select(mode) {
    if (this.world) {
      const geometries = new Set(), materials = new Set();
      this.world.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); if(object.isLight && object.shadow)object.shadow.dispose(); });
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
    }
    this.mode = mode; this.world = new T.Scene(); this.monster = null;
    this.world.background = this.surfaces.sky; this.world.environment=this.surfaces.environment.texture;
    this.world.fog = new T.FogExp2('#b5c7ce', .0015);
    this.world.add(new T.HemisphereLight('#e5f5ff', '#384535', .7));
    const sun = new T.DirectionalLight('#fff0d6', 2.5); sun.position.set(-200,450,-180);
    sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.camera.near=1;sun.shadow.camera.far=800;sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;
    this.sun=sun;this.world.add(sun,sun.target);
    this.landscape(mode === 'scare');
    if (mode === 'coaster') this.coaster();
    if (mode === 'bridge') this.bridge();
    if (mode === 'scare') this.forest();
    if (mode === 'bungee') this.bungee();
  }
  landscape(forest) {
    const rand = random(), rock = new T.MeshStandardMaterial({ vertexColors: true, map:this.surfaces.rock,bumpMap:this.surfaces.rock,bumpScale:1.3, roughness: .98 });
    const geometry = new T.CylinderGeometry(.65, 1, 1, 36, 46);
    const positions = geometry.attributes.position, colors = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const grain = (fbm(x*4+z*2,y*3)-.5)*.6 + Math.sin(y*35+noise(x*4,z*4)*4)*.025;
      positions.setXYZ(i, x * (1 + grain), y+(fbm(x*4,z*4)-.5)*.055, z * (1 + grain));
      const moss=T.MathUtils.smoothstep(y,.22,.49)*fbm(x*8,z*8);
      const color = new T.Color('#b9b8a7').lerp(new T.Color('#45623b'),moss);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    const peaks = new T.InstancedMesh(geometry, rock, 160), dummy = new T.Object3D();
    for (let i = 0; i < 160; i++) {
      const side = i % 2 ? 1 : -1, height = 140 + rand() * 280;
      dummy.position.set(side * (100 + rand() * 640), height / 2 - 18, 220 - rand() * 1550);
      dummy.scale.set(26 + rand() * 75, height, 28 + rand() * 65); dummy.rotation.y = rand() * Math.PI; dummy.updateMatrix(); peaks.setMatrixAt(i, dummy.matrix);
    }
    this.world.add(peaks);
    peaks.castShadow=true;peaks.receiveShadow=true;
    const ground = this.mesh(new T.PlaneGeometry(3000, 3000), this.material('#a1ab83',{map:this.surfaces.soil,bumpMap:this.surfaces.soil,bumpScale:.5}), v(0, -5, -450)); ground.rotation.x = -Math.PI / 2;
    const river = this.mesh(new T.PlaneGeometry(70, 2400, 8, 100), this.material('#568f96', { roughness: .22, metalness: .35 }), v(0, -3, -450)); river.rotation.x = -Math.PI / 2;
    const rp = river.geometry.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setX(i, rp.getX(i) + Math.sin(rp.getY(i) * .006) * 20);
    river.geometry.computeVertexNormals();
    if (forest) { ground.position.y = 0; river.position.x = -75; }
  }
  coaster() {
    const points = [v(0,230,45),v(0,248,5),v(0,250,-18),v(0,240,-35),v(0,170,-65),v(0,55,-105),v(0,24,-170)];
    const loopFirst = points.length;
    for(let i=0;i<=48;i++) {
      const angle=i/48*Math.PI*2;
      points.push(v(0,24+34*(1-Math.cos(angle)),-220-34*Math.sin(angle)-i/48*6));
    }
    const loopLast = points.length-1;
    points.push(v(0,24,-280),v(0,60,-360),v(0,26,-470),v(0,32,-580));
    this.track = new T.CatmullRomCurve3(points);
    this.track.arcLengthDivisions=2000;
    const lengths=this.track.getLengths(2000), total=lengths[2000];
    this.loopStart=lengths[Math.round(loopFirst/(points.length-1)*2000)]/total;
    this.loopEnd=lengths[Math.round(loopLast/(points.length-1)*2000)]/total;
    const steel = this.material('#748589', { metalness: .8, roughness: .3 }), rail = this.material('#b9bcb4', { metalness: .8, roughness: .24 });
    for (const side of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 450; i++) {
        const u = i / 450, p = this.track.getPointAt(u), lateral = v(1,0,0);
        points.push(p.addScaledVector(lateral, side * .9));
      }
      this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 500, .13, 7, false), rail);
    }
    const sleepers = new T.InstancedMesh(new T.BoxGeometry(2.5, .16, .24), steel, 380), dummy = new T.Object3D();
    for (let i = 0; i < 380; i++) {
      const u = i / 379, p = this.track.getPointAt(u), tangent=this.track.getTangentAt(u); dummy.position.copy(p); dummy.up.copy(v(1,0,0).cross(tangent).normalize()); dummy.lookAt(p.clone().add(tangent)); dummy.updateMatrix(); sleepers.setMatrixAt(i, dummy.matrix);
      if (i % 14 === 0 && !(u>this.loopStart && u<this.loopEnd)) {
        this.beam(v(p.x - 2, 0, p.z), v(p.x - 1, p.y - .4, p.z), .45, steel);
        this.beam(v(p.x + 2, 0, p.z), v(p.x + 1, p.y - .4, p.z), .45, steel);
        this.beam(v(p.x - 2, 4, p.z), v(p.x + 1, p.y - 2, p.z), .18, steel);
      }
    }
    this.world.add(sleepers);
    this.car = new T.Group(); this.world.add(this.car);
    this.mesh(new T.BoxGeometry(2.1, .35, 1.5), this.material('#263b3c', { metalness: .4 }), v(0, -.8, -.4), null, this.car);
    this.beam(v(-.9,-.42,-.6), v(.9,-.42,-.6), .075, rail, this.car);
    for (const x of [-.9,.9]) this.beam(v(x,-.8,-.6),v(x,-.42,-.6),.06,rail,this.car);
  }
  bridge() {
    const metal = this.material('#c9cecb', { metalness: .8, roughness: .28 });
    const glass = new T.MeshPhysicalMaterial({color:'#c8e6e4',transparent:true,opacity:.38,metalness:.05,roughness:.06,transmission:.75,thickness:.08,ior:1.5,clearcoat:1,envMapIntensity:1.3,depthWrite:false,side:T.DoubleSide});
    this.bridgeShards=[];this.bridgeCracks=null;
    for (let i = 0; i < 100; i++) {
      const z = 130 - i * 4;
      const pane=this.mesh(new T.BoxGeometry(6, .09, 3.8), glass, v(0, 260, z));
      if(i===33)this.breakingPane=pane;
      this.mesh(new T.BoxGeometry(6.3, .16, .12), metal, v(0, 259.9, z - 2));
      if (i % 2 === 0) for (const x of [-3.1,3.1]) {
        this.beam(v(x,260,z),v(x,261.4,z),.045,metal);
        const cableY = 263 + Math.pow((z + 65) / 195, 2) * 35;
        this.beam(v(x,260,z),v(x,cableY,z),.026,metal);
      }
    }
    for (const x of [-3.1,3.1]) {
      for (const y of [259.85,260.55,261.4]) this.beam(v(x,y,132),v(x,y,-268),.055,metal);
      const points = []; for (let z = 132; z >= -268; z -= 4) points.push(v(x,263 + Math.pow((z+65)/195,2)*35,z));
      this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),100,.13,6,false),metal);
    }
    for (const z of [-268,132]) {
      for (const x of [-5,5]) this.mesh(new T.BoxGeometry(2,55,3),this.material('#bdc6c5'),v(x,276,z));
      this.mesh(new T.BoxGeometry(12,2,3),metal,v(0,301,z));
    }
  }
  buildBridgeFracture() {
    const rand=random(902), vertices=[], edges=[];
    // A shared irregular triangulation fills exactly the pane beneath the walking camera.
    for(let row=0;row<=4;row++)for(let col=0;col<=6;col++)
      vertices.push(v(-3+col+(col>0&&col<6?(rand()-.5)*.55:0),260.05,-3.9+row*.95+(row>0&&row<4?(rand()-.5)*.4:0)));
    const material=this.breakingPane.material.clone();material.transmission=.25;material.opacity=.58;
    const add=(a,b,c)=>{
      const center=a.clone().add(b).add(c).multiplyScalar(1/3);
      const geometry=new T.BufferGeometry().setFromPoints([a.clone().sub(center),b.clone().sub(center),c.clone().sub(center)]);
      geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));geometry.computeVertexNormals();
      const shard=this.mesh(geometry,material,center);shard.visible=false;
      this.bridgeShards.push({mesh:shard,center,velocity:v((rand()-.5)*3,-.6-rand()*2,(rand()-.5)*3),spin:v((rand()-.5)*5,(rand()-.5)*3,(rand()-.5)*5)});
      edges.push(a,b,b,c,c,a);
    };
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const a=vertices[row*7+col],b=vertices[row*7+col+1],c=vertices[(row+1)*7+col],d=vertices[(row+1)*7+col+1];
      add(a,c,b);add(b,c,d);
    }
    this.bridgeCracks=new T.LineSegments(new T.BufferGeometry().setFromPoints(edges),new T.LineBasicMaterial({color:'#eafcff',transparent:true,opacity:.9,depthTest:false}));
    this.bridgeCracks.renderOrder=5;this.bridgeCracks.visible=false;this.world.add(this.bridgeCracks);
  }
  updateBridgeFracture(t) {
    if(!this.bridgeCracks)this.buildBridgeFracture();
    const broken=t>=6.25, age=Math.max(0,t-6.25);
    this.breakingPane.visible=!broken;
    this.bridgeCracks.visible=t>=6&& !broken;
    this.bridgeCracks.geometry.setDrawRange(0,Math.floor(smooth(6,6.2,t)*this.bridgeCracks.geometry.attributes.position.count/2)*2);
    for(const {mesh,center,velocity,spin} of this.bridgeShards){
      mesh.visible=broken && age<8;
      mesh.position.copy(center).addScaledVector(velocity,age);mesh.position.y-=4.905*age*age;
      mesh.rotation.set(spin.x*age,spin.y*age,spin.z*age);
    }
  }
  forest() {
    this.world.fog.color.set('#b9d8cd'); this.world.fog.density = .012;
    const rand = random(96), bark = this.material('#b0a08c',{map:this.surfaces.bark,bumpMap:this.surfaces.bark,bumpScale:.12}), leaves = this.material('#49612f',{roughness:1});
    const trunks = new T.InstancedMesh(new T.CylinderGeometry(.22,.5,12,7),bark,220);
    const crowns = new T.InstancedMesh(new T.IcosahedronGeometry(1,1),leaves,220*12);
    const dummy = new T.Object3D();
    for (let i=0;i<220;i++) {
      const x=(i%2?1:-1)*(5+rand()*65), z=25-rand()*230, height=8+rand()*14;
      dummy.position.set(x,height/2,z); dummy.scale.set(1,height/12,1); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix);
      for(let j=0;j<12;j++){
        dummy.position.set(x+(rand()-.5)*7,height+(rand()-.5)*5,z+(rand()-.5)*7);
        dummy.scale.set(1+rand()*1.9,.6+rand()*1.3,1+rand()*1.9);dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();crowns.setMatrixAt(i*12+j,dummy.matrix);
        crowns.setColorAt(i*12+j,new T.Color().setHSL(.21+rand()*.06,.28,.24+rand()*.13));
      }
      dummy.rotation.set(0,0,0);
    }
    this.world.add(trunks,crowns);
    trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;
    const path=this.mesh(new T.PlaneGeometry(5,300),this.material('#c4b997'),v(0,.025,-100));path.rotation.x=-Math.PI/2;
    const flowerGeo=new T.IcosahedronGeometry(.13,0), flowers=new T.InstancedMesh(flowerGeo,this.material('#eee0aa'),500);
    for(let i=0;i<500;i++){dummy.position.set((i%2?1:-1)*(2.8+rand()*10),.2,15-rand()*130);dummy.scale.setScalar(.7+rand());dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}this.world.add(flowers);
    this.monster = new T.Group(); this.world.add(this.monster);
    const skin=this.material('#b8b2a1',{roughness:1}), black=this.material('#080a0b'), eye=this.material('#efe2b5',{emissive:'#beab77',emissiveIntensity:1.2});
    this.mesh(new T.SphereGeometry(1,40,32),skin,v(0,0,0),v(.65,.96,.45),this.monster);
    for(const x of [-.27,.27]){
      this.mesh(new T.SphereGeometry(1,24,20),black,v(x,.22,.38),v(.23,.29,.13),this.monster);
      this.mesh(new T.SphereGeometry(1,16,12),eye,v(x,.22,.5),v(.055,.07,.025),this.monster);
      const brow=this.mesh(new T.BoxGeometry(.4,.1,.13),black,v(x,.49,.37),null,this.monster);brow.rotation.z=x>0?-.23:.23;
    }
    this.mesh(new T.SphereGeometry(1,24,24),black,v(0,-.43,.4),v(.29,.4,.14),this.monster);
    this.mesh(new T.ConeGeometry(.12,.35,5),skin,v(0,.03,.56),v(1,1,.8),this.monster);
    for(let i=0;i<7;i++)this.mesh(new T.ConeGeometry(.044,.16,5),skin,v((i-3)*.063,-.17,.51),null,this.monster);
    this.mesh(new T.SphereGeometry(1,20,16),black,v(0,-1.5,-.1),v(1.2,1.2,.48),this.monster);
    this.monster.visible=false;
  }
  bungee() {
    this.world.fog.color.set('#b5c7ce'); this.world.fog.density = .002;
    const cliff = this.material('#a1a496', {map:this.surfaces.rock,bumpMap:this.surfaces.rock,bumpScale:.6, roughness: 1 }), rock = this.material('#37453d', { roughness: 1 });
    this.mesh(new T.BoxGeometry(34, 4, 42), cliff, v(0, 176, 18));
    this.mesh(new T.BoxGeometry(12, 1.2, 5), rock, v(0, 178.6, -1));
    this.mesh(new T.BoxGeometry(2, 2.2, .35), this.material('#d2b37c', { metalness: .35 }), v(-4, 180, -3));
    const cord = this.material('#e9e5d4', { roughness: .7 });
    this.bungeeCord = this.mesh(new T.CylinderGeometry(.055, .055, 1, 8), cord, v(0, 120, 0));
    const metal=this.material('#899397',{metalness:.8,roughness:.32});
    for(const x of [-3,3]){this.beam(v(x,179,12),v(x,179,-3),.07,metal);this.beam(v(x,179,-3),v(x,180.6,-3),.06,metal);this.beam(v(x,180.6,-3),v(x,180.6,12),.05,metal);}
    this.mesh(new T.BoxGeometry(24,180,25),cliff,v(0,86,25));
  }
  render(mode, t, { yaw, pitch, scareAt }) {
    if (!this.world || this.mode !== mode) this.select(mode);
    let position, target, phase, volume=.02, roll=0, fov=76;
    if(mode==='coaster') {
      const crest=.06;
      const u=t<7 ? t/7*crest : t<12 ? crest+Math.pow((t-7)/5,1.8)*(this.loopStart-crest) : t<19 ? this.loopStart+(t-12)/7*(this.loopEnd-this.loopStart) : this.loopEnd+(t-19)/9*(.98-this.loopEnd);
      const p=this.track.getPointAt(clamp(u,0,.98)), tangent=this.track.getTangentAt(clamp(u,0,.98));
      const normal=v(1,0,0).cross(tangent).normalize();
      this.camera.up.copy(normal);
      position=p.clone().addScaledVector(normal,1.25); target=position.clone().addScaledVector(tangent,20);
      const speed=t<7?.08:t<13?smooth(7,12,t):.7;
      roll=t>13?Math.sin((t-13)*.5)*.13:Math.sin(t*29)*speed*.005;
      fov=76+speed*20;volume=.025+speed*.14;
      this.car.position.copy(position);this.car.quaternion.setFromRotationMatrix(new T.Matrix4().lookAt(position,target,normal));
      phase=t<5?'缓慢爬升':t<7?'即将越过顶点':t<12?'垂直俯冲':t<19?'360° 垂直圆环 · 翻转倒悬':'冲出圆环，掠过山谷';
    } else if(mode==='bridge') {
      this.updateBridgeFracture(t);
      const fall=Math.max(0,t-6.35),walk=Math.min(t,6.25),still=1-smooth(5.5,6.25,t);
      position=v(Math.sin(walk*1.4)*.045*still,261.7+Math.sin(walk*3)*.035*still,10-walk*2);
      const tilt=.14+1.3*smooth(4.8,6.35,t);
      target=position.clone().add(v(0,-Math.sin(tilt)*30,-Math.cos(tilt)*30));
      phase=t<6?'沿着玻璃桥向前走':t<6.25?'脚下出现裂纹':t<6.35?'玻璃碎了！':'失去支撑 · 坠入深谷';
      if(t>=6.35) {
        // Match free-fall velocity to a short braking arc, avoiding a position jump at the bottom.
        const brakeTime=2*(261.7-4.9*36-38)/58.8, brake=clamp(fall-6,0,brakeTime);
        const height=fall<6?261.7-4.9*fall*fall:261.7-4.9*36-58.8*brake+29.4/brakeTime*brake*brake;
        position=v(Math.sin(fall*2)*.1*smooth(0,1,fall),height,-2.5-fall*.35);
        target=position.clone().add(v(0,-Math.sin(tilt)*30,-Math.cos(tilt)*30));
        roll=Math.sin(fall*9)*.045*Math.exp(-fall*.7);fov=76+smooth(0,4,fall)*18;volume=.04+smooth(0,4,fall)*.14;
        if(fall>6){const settle=smooth(6,10,fall);target=position.clone().add(v(0,-Math.sin(tilt)*30+22*settle,-Math.cos(tilt)*30-24*settle));volume=.18-.14*settle;phase='在山间慢慢停住';}
      }
      if(t>=6.25&&t<6.65)volume=.24*Math.exp(-(t-6.25)*6);
    } else if(mode==='bungee') {
      const fall=Math.max(0,t-3), sample=this.bungeeSample(fall), sway=smooth(0,2,fall)*Math.exp(-fall*.08);
      position=v(Math.sin(fall*1.3)*sway*1.6,180.2-sample.distance,-3.7-9*smooth(0,2.5,fall)+Math.sin(fall*.9)*sway);
      target=position.clone().add(v(0,-8-32*smooth(0,2,fall),-25+15*smooth(0,2,fall)));
      phase=t<3?`准备起跳 · ${Math.ceil(3-t)}`:sample.distance<62 && sample.velocity>0?'踏空 · 自由落体':sample.velocity<-.8?'绳索回弹 · 向上升起':Math.abs(sample.velocity)<.8?'绳索拉紧 · 悬停': '绳索伸展 · 再次下坠';
      const speed=clamp(Math.abs(sample.velocity)/40,0,1);
      roll=Math.sin(fall*1.3)*sway*.045;fov=76+speed*12;volume=.025+speed*.15;
      const ropeTop=v(-4,180,-3),ropeBottom=v(position.x+.4,position.y-.9,position.z+.5);
      this.bungeeCord.position.copy(ropeTop).add(ropeBottom).multiplyScalar(.5);this.bungeeCord.scale.y=ropeTop.distanceTo(ropeBottom);
      this.bungeeCord.quaternion.setFromUnitVectors(up,ropeBottom.clone().sub(ropeTop).normalize());
    } else {
      position=v(Math.sin(t*.6)*.08,1.75+Math.sin(t*2.7)*.025,12-t*.85);target=position.clone().add(v(Math.sin(t*.25)*2,.2,-20));phase='林间漫步';volume=.018;
    }
    if(mode!=='coaster')this.camera.up.copy(up);
    this.camera.position.copy(position);this.camera.lookAt(target);this.base.copy(this.camera.quaternion);
    this.sun.target.position.copy(position);
    this.sun.position.copy(position).add(v(-130,230,-150));
    this.offset.setFromEuler(new T.Euler(pitch,yaw,roll,'YXZ'));this.camera.quaternion.multiply(this.offset);
    if(mode==='scare'){
      const fright=t>=scareAt && t<scareAt+1.7;this.monster.visible=fright;
      if(fright){
        const q=clamp((t-scareAt)/.16,0,1), distance=8-q*6.85;
        this.monster.position.copy(this.camera.position).add(v(Math.sin(t*57)*.025,Math.cos(t*41)*.025,-distance).applyQuaternion(this.camera.quaternion));
        this.monster.quaternion.copy(this.camera.quaternion); this.monster.rotateZ(Math.sin(t*31)*.07);
        fov=85;volume=.22;phase='它就在眼前';
      }
      this.renderer.toneMappingExposure=fright?.65:1.15;
    } else this.renderer.toneMappingExposure=1.15;
    this.camera.fov=fov;this.camera.updateProjectionMatrix();this.renderer.render(this.world,this.camera);
    return {phase,volume,shatter:mode==='bridge'&&t>=6.25&&t<6.65,fright:mode==='scare' && t>=scareAt && t<scareAt+1.7};
  }
}
