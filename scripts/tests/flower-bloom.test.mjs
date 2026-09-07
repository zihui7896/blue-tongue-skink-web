import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLOWERS, DURATION, layerProgress, petalPosition, stageFor } from '../effects/particle-bloom/geometry.js';
import { makeVeilPetals } from '../effects/particle-bloom/VeilPetals.js';
import { ParticleBloomEffect } from '../effects/particle-bloom/ParticleBloomEffect.js';
for (const [kind,config] of Object.entries(FLOWERS)) {
  test(`${kind}: complete, finite articulated geometry`,()=>{
    const group=makeVeilPetals({value:0},kind);
    assert.equal(group.children.length,config.counts.reduce((a,b)=>a+b));
    for(const mesh of group.children){
      const g=mesh.geometry;
      for(const attr of Object.values(g.attributes)) for(const value of attr.array)assert(Number.isFinite(value));
      assert.equal(g.attributes.position.count,g.attributes.opened.count);
      for(const index of g.index.array)assert(index<g.attributes.position.count);
      assert(mesh.material.transparent); assert.equal(mesh.material.depthWrite,false);
      g.dispose();mesh.material.dispose();
    }
    for(let layer=0;layer<config.counts.length;layer++){
      assert.equal(layerProgress(0,layer,config.counts.length),0);
      assert.equal(layerProgress(1,layer,config.counts.length),1);
      for(let i=0;i<100;i++)assert(layerProgress(i/100,layer,config.counts.length)<=layerProgress((i+1)/100,layer,config.counts.length));
      for(const p of [0,.2,.5,.8,1]) for(const t of [0,.3,.7,1]) for(const u of [-1,0,1])assert(petalPosition(t,u,layer,.6,p,kind).every(Number.isFinite));
    }
  });
}
test('three independent cards and complete stage controls',()=>{
 const html=readFileSync(new URL('../../workspace.html',import.meta.url),'utf8');
 for(const kind of Object.keys(FLOWERS))assert(html.includes(`data-flower="${kind}"`));
 assert.equal([...html.matchAll(/data-bloom-replay/g)].length,3);
 assert.equal([...html.matchAll(/data-bloom-progress/g)].length,3);
 assert.deepEqual([0,.25,.48,.76,1].map(stageFor),[0,1,2,3,4]);
});
test('playback stops at full bloom; replay returns to bud',()=>{
 let scheduled=0; globalThis.requestAnimationFrame=()=>++scheduled;
 const effect={elapsed:DURATION-.01,last:0,speed:1,paused:false,update(){},frame(){},sync(){this.synced=true;}};
 ParticleBloomEffect.prototype.frame.call(effect,40);
 assert.equal(effect.elapsed,DURATION);assert.equal(effect.paused,true);assert.equal(scheduled,0);
 ParticleBloomEffect.prototype.replay.call(effect);
 assert.equal(effect.elapsed,0);assert.equal(effect.paused,false);assert(effect.synced);
});
