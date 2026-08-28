import{PetalBloomEffect}from"../shared/PetalBloomEffect.js";

export class BloomingFlowerEffect extends PetalBloomEffect{
  constructor(canvas){
    super(canvas,{seed:20260828,duration:8400,flowerImage:"assets/effects/blooming-flower/flower-3d-alpha.png",petalImage:"assets/effects/blooming-flower/peony-petal-alpha.png",center:{x:.57,y:.53},finalSize:{x:.84,y:1.08},finalRotation:0,layers:[{count:9,radius:.19,width:.34,height:.38,delay:.42,stagger:.08,twist:.28,phase:0},{count:12,radius:.13,width:.25,height:.3,delay:.2,stagger:.09,twist:.42,phase:.22},{count:15,radius:.075,width:.17,height:.22,delay:.04,stagger:.07,twist:.58,phase:.08}],palette:{glow:"rgba(255,138,190,",mid:"rgba(70,67,104,.11)",shadow:"rgba(255,93,162,.22)",particleGlow:"rgba(255,125,187,.62)",particles:["rgba(255,151,194,","rgba(255,207,219,","rgba(193,123,185,"]}});
  }
}
