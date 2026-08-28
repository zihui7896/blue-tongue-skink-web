import{PetalBloomEffect}from"../shared/PetalBloomEffect.js";

export class BloomingRoseEffect extends PetalBloomEffect{
  constructor(canvas){
    super(canvas,{seed:20260829,duration:7800,flowerImage:"assets/effects/blooming-rose/rose-3d-alpha.png",petalImage:"assets/effects/blooming-rose/rose-petal-alpha.png",center:{x:.54,y:.53},finalSize:{x:.86,y:1.1},finalRotation:-.012,layers:[{count:8,radius:.19,width:.33,height:.39,delay:.04,stagger:.08,twist:.38,phase:.12},{count:10,radius:.125,width:.25,height:.31,delay:.2,stagger:.08,twist:.64,phase:.4},{count:12,radius:.065,width:.17,height:.23,delay:.38,stagger:.09,twist:.92,phase:.16}],palette:{glow:"rgba(255,70,155,",mid:"rgba(101,49,120,.13)",shadow:"rgba(246,54,153,.27)",particleGlow:"rgba(255,100,189,.7)",particles:["rgba(255,102,178,","rgba(255,205,225,","rgba(151,104,235,"]}});
  }
}
