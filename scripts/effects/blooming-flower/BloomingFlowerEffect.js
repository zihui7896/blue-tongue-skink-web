import{PetalBloomEffect}from"../shared/PetalBloomEffect.js";

export class BloomingFlowerEffect extends PetalBloomEffect{
  constructor(canvas){
    super(canvas,{seed:20260828,duration:8600,backdrop:false,particleCount:32,petalImages:["assets/effects/shared/sakura-petal-v1.png","assets/effects/shared/sakura-petal-curled-v1.png"],flowerImage:"assets/effects/blooming-flower/flower-natural-v2.png",budImage:"assets/effects/blooming-flower/flower-bud-natural-v2.png",center:{x:.57,y:.53},finalSize:{x:.84,y:1.08},openingRotation:-.018,finalRotation:0,grade:{saturation:1,brightness:1,contrast:1,hue:0},mesh:{columns:15,rows:15,flowerCenter:{x:.51,y:.45},stemStart:.76,innerCompression:.9,outerCompression:.8,bottomCompression:.85,innerDelay:.24,curl:.02,phase:.8},palette:{glow:"rgba(239,188,197,",mid:"rgba(49,70,68,.13)",shadow:"rgba(126,84,82,.16)",particleGlow:"rgba(229,143,160,.34)",particles:["rgba(230,159,174,","rgba(248,220,218,","rgba(177,193,164,"]}});
  }
}
