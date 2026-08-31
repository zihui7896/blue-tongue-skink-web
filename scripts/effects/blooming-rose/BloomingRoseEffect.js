import{PetalBloomEffect}from"../shared/PetalBloomEffect.js";

export class BloomingRoseEffect extends PetalBloomEffect{
  constructor(canvas){
    super(canvas,{seed:20260829,duration:8000,flowerImage:"assets/effects/blooming-rose/rose-natural-v2.png",center:{x:.54,y:.53},finalSize:{x:.86,y:1.1},openingRotation:.02,finalRotation:-.012,grade:{saturation:1,brightness:1,contrast:1,hue:0},mesh:{columns:15,rows:15,flowerCenter:{x:.5,y:.46},stemStart:.77,innerCompression:.88,outerCompression:.76,bottomCompression:.82,innerDelay:.3,curl:.02,phase:1.7},palette:{glow:"rgba(238,178,181,",mid:"rgba(51,68,65,.13)",shadow:"rgba(128,80,78,.16)",particleGlow:"rgba(232,166,172,.4)",particles:["rgba(225,145,158,","rgba(247,215,211,","rgba(169,191,158,"]}});
  }
}
