export const DURATION = 8;
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = x => { const t = clamp01(x); return t*t*(3-2*t); };
export const FLOWERS = {
  lotus: { counts:[9,10,10,9,8], width:1, ripple:.025, twist:.10, pink:[.94,.78,.83], spread:1.32 },
  peony: { counts:[11,13,14,13,11,9], width:1.12, ripple:.075, twist:.16, pink:[.98,.72,.81], spread:1.15 },
  rose: { counts:[7,8,8,7,6,5], width:.98, ripple:.018, twist:.65, pink:[.91,.48,.62], spread:.91 }
};
export function layerProgress(progress, layer, layers=5) {
  return smooth((progress-(.10+layer/(layers-1)*.46))/.32);
}
export function stageFor(progress) {return progress<.12?0:progress<.35?1:progress<.61?2:progress<.88?3:4;}
export function petalPosition(t,u,layer,angle,progress,kind='lotus') {
  const cfg=FLOWERS[kind], normalized=layer/(cfg.counts.length-1);
  const opening=layerProgress(progress,layer,cfg.counts.length);
  const radius=.98-normalized*.36;
  // Closed surfaces wrap a rounded bud; inner whorls remain cupped in bloom.
  const arc=(2.96-opening*(1.60-normalized*1.20))*t;
  const reach=1+opening*(1-normalized)*cfg.spread;
  const radial=Math.sin(arc)*radius*reach+.035;
  const width=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.56)*(.70-normalized*.22)*cfg.width;
  const side=u*width*(.82+opening*.18);
  const fringe=Math.sin(u*19+t*14+angle*2)*cfg.ripple*Math.pow(Math.abs(u),4)*Math.sin(Math.PI*t);
  const scallop=Math.sin(u*12+angle*2)*.055*Math.pow(t,5);
  const height=(1-Math.cos(arc))*radius-opening*(1-normalized)*.26*t+normalized*.24+fringe+scallop;
  const twist=angle+cfg.twist*t*normalized+opening*cfg.twist*.20;
  return [Math.cos(twist)*radial-Math.sin(twist)*side,height,Math.sin(twist)*radial+Math.cos(twist)*side];
}
