import * as T from '../vendor/three.module.js';

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
      this.world.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
    }
    this.mode = mode; this.world = new T.Scene(); this.monster = null;
    this.world.background = new T.Color('#a7c7cf'); this.world.fog = new T.FogExp2('#a7c7cf', .0018);
    this.world.add(new T.HemisphereLight('#e5f5ff', '#465539', 2));
    const sun = new T.DirectionalLight('#fff0cb', 3.2); sun.position.set(-200, 450, -180); this.world.add(sun);
    this.landscape(mode === 'scare');
    if (mode === 'coaster') this.coaster();
    if (mode === 'bridge') this.bridge();
    if (mode === 'scare') this.forest();
  }
  landscape(forest) {
    const rand = random(), rock = new T.MeshStandardMaterial({ vertexColors: true, roughness: .98 });
    const geometry = new T.CylinderGeometry(.65, 1, 1, 15, 20);
    const positions = geometry.attributes.position, colors = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const grain = Math.sin(x * 13 + z * 23 + y * 30) * .09 + Math.cos(y * 60) * .045;
      positions.setXYZ(i, x * (1 + grain), y, z * (1 + grain));
      const color = new T.Color().setHSL(.21 + rand() * .04, .12 + rand() * .12, .2 + rand() * .15 + (y > .4 ? .06 : 0));
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
    const ground = this.mesh(new T.PlaneGeometry(3000, 3000), this.material('#405b40'), v(0, -5, -450)); ground.rotation.x = -Math.PI / 2;
    const river = this.mesh(new T.PlaneGeometry(70, 2400, 8, 100), this.material('#568f96', { roughness: .22, metalness: .35 }), v(0, -3, -450)); river.rotation.x = -Math.PI / 2;
    const rp = river.geometry.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setX(i, rp.getX(i) + Math.sin(rp.getY(i) * .006) * 20);
    river.geometry.computeVertexNormals();
    if (forest) { ground.position.y = 0; river.position.x = -75; }
  }
  coaster() {
    this.track = new T.CatmullRomCurve3([v(0, 230, 45),v(0, 248, 5),v(0, 250, -18),v(0, 240, -35),v(0, 170, -65),v(0, 55, -105),v(15, 24, -160),v(70, 44, -220),v(110, 90, -290),v(60, 70, -380),v(0, 26, -470),v(-45, 32, -580)]);
    const steel = this.material('#748589', { metalness: .8, roughness: .3 }), rail = this.material('#b9bcb4', { metalness: .8, roughness: .24 });
    for (const side of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 450; i++) {
        const u = i / 450, p = this.track.getPointAt(u), tangent = this.track.getTangentAt(u), lateral = tangent.clone().cross(up).normalize();
        points.push(p.addScaledVector(lateral, side * .9));
      }
      this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 500, .13, 7, false), rail);
    }
    const sleepers = new T.InstancedMesh(new T.BoxGeometry(2.5, .16, .24), steel, 380), dummy = new T.Object3D();
    for (let i = 0; i < 380; i++) {
      const u = i / 379, p = this.track.getPointAt(u); dummy.position.copy(p); dummy.lookAt(p.clone().add(this.track.getTangentAt(u))); dummy.updateMatrix(); sleepers.setMatrixAt(i, dummy.matrix);
      if (i % 14 === 0) {
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
    const glass = this.material('#93c6ce', { transparent: true, opacity: .2, metalness: .35, roughness: .12, depthWrite: false, side: T.DoubleSide });
    for (let i = 0; i < 100; i++) {
      const z = 130 - i * 4;
      this.mesh(new T.BoxGeometry(6, .09, 3.8), glass, v(0, 260, z));
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
  forest() {
    this.world.background.set('#b9d8cd'); this.world.fog.color.set('#b9d8cd'); this.world.fog.density = .012;
    const rand = random(96), bark = this.material('#524c37'), leaves = this.material('#557b37');
    const trunks = new T.InstancedMesh(new T.CylinderGeometry(.22,.5,12,7),bark,220);
    const crowns = new T.InstancedMesh(new T.IcosahedronGeometry(1,2),leaves,220);
    const dummy = new T.Object3D();
    for (let i=0;i<220;i++) {
      const x=(i%2?1:-1)*(5+rand()*65), z=25-rand()*230, height=8+rand()*14;
      dummy.position.set(x,height/2,z); dummy.scale.set(1,height/12,1); dummy.updateMatrix(); trunks.setMatrixAt(i,dummy.matrix);
      dummy.position.y=height; dummy.scale.set(3+rand()*3,4+rand()*3,3+rand()*3); dummy.updateMatrix(); crowns.setMatrixAt(i,dummy.matrix);
    }
    this.world.add(trunks,crowns);
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
  render(mode, t, { yaw, pitch, scareAt }) {
    if (!this.world || this.mode !== mode) this.select(mode);
    let position, target, phase, volume=.02, roll=0, fov=76;
    if(mode==='coaster') {
      const u=t<7 ? t/7*.075 : t<13 ? .075+Math.pow((t-7)/6,1.8)*.42 : .495+(t-13)/11*.48;
      const p=this.track.getPointAt(clamp(u,0,.98)), tangent=this.track.getTangentAt(clamp(u,0,.98));
      const side=tangent.clone().cross(up).normalize(), normal=side.clone().cross(tangent).normalize();
      position=p.clone().addScaledVector(normal,1.25); target=position.clone().addScaledVector(tangent,20);
      const speed=t<7?.08:t<13?smooth(7,12,t):.7;
      roll=t>13?Math.sin((t-13)*.5)*.13:Math.sin(t*29)*speed*.005;
      fov=76+speed*20;volume=.025+speed*.14;
      this.car.position.copy(position);this.car.quaternion.setFromRotationMatrix(new T.Matrix4().lookAt(position,target,up));
      phase=t<5?'缓慢爬升':t<7?'即将越过顶点':t<13?'垂直俯冲':'高速掠过山谷';
    } else if(mode==='bridge') {
      if(t<7){position=v(Math.sin(t*1.4)*.045,261.7+Math.sin(t*3)*.035,10-t*1.6);target=v(0,261.2-smooth(3,7,t)*65,-28);phase=t<3?'走上玻璃桥':'透过玻璃，看向谷底';}
      else {
        const fall=Math.max(0,t-8.3);
        // Match free-fall velocity to a short braking arc, avoiding a position jump at the bottom.
        const brakeTime=2*(261.7-4.9*36-38)/58.8, brake=clamp(fall-6,0,brakeTime);
        const height=fall<6?261.7-4.9*fall*fall:261.7-4.9*36-58.8*brake+29.4/brakeTime*brake*brake;
        position=v(smooth(7,9,t)*7.5,height, -1.2-(t-7)*3);
        target=position.clone().add(v(-1,-35,-6));phase=t<8.3?'跃出桥面':t<15?'坠入深谷':'在云雾中缓缓停住';
        roll=Math.sin(t*2)*.025;fov=76+smooth(8.3,13,t)*22;volume=.04+smooth(8.3,13,t)*.14;
        if(t>14.3){const settle=smooth(14.3,18,t);target=position.clone().add(v(0,-35+27*settle,-6-24*settle));volume=.18-.14*settle;}
      }
    } else {
      position=v(Math.sin(t*.6)*.08,1.75+Math.sin(t*2.7)*.025,12-t*.85);target=position.clone().add(v(Math.sin(t*.25)*2,.2,-20));phase='林间漫步';volume=.018;
    }
    this.camera.position.copy(position);this.camera.lookAt(target);this.base.copy(this.camera.quaternion);
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
    return {phase,volume,fright:mode==='scare' && t>=scareAt && t<scareAt+1.7};
  }
}
