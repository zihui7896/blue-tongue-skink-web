export const DURATION = 8;
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = x => { const t = clamp01(x); return t*t*(3-2*t); };
export const FLOWERS = {
  lotus: { counts:[9,10,10,9,8], width:1, ripple:.025, twist:.10, color:[.22,.65,.91], spread:1.32 },
  peony: { counts:[11,13,14,13,11,9], width:1.12, ripple:.075, twist:.16, color:[.49,.35,.82], spread:1.15 },
  rose: { counts:[7,8,8,7,6,5], width:.98, ripple:.018, twist:.65, color:[.72,.08,.19], spread:.91 }
};
export function stageFor(progress) {return progress<.12?0:progress<.35?1:progress<.61?2:progress<.88?3:4;}
