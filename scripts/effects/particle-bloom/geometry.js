export const DURATION = 8;
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const smooth = x => { const t = clamp01(x); return t*t*(3-2*t); };
export const FLOWERS = {
  lotus: { counts:[5,5,6,6,5], width:1.05, ripple:.025, twist:.10, color:[.22,.65,.91], spread:1.32 },
  peony: { counts:[5,6,7,8,9], width:1.22, ripple:.048, twist:.16, color:[.88,.32,.43], spread:1.28 },
  rose: { counts:[5,6,7,8,8], width:1.20, ripple:.024, twist:.34, color:[.64,.20,.30], spread:1.38 }
};
export function stageFor(progress) {return progress<.12?0:progress<.35?1:progress<.61?2:progress<.88?3:4;}
