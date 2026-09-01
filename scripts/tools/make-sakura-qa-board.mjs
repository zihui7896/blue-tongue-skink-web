import sharp from "sharp";
import {fileURLToPath} from "node:url";

const root=new URL("../../",import.meta.url);
const screenshots=new URL("assets/screenshots/",root);
const width=640;
const height=400;
const gap=20;
const petalBackdrop={r:239,g:242,b:240,alpha:1};
const file=url=>fileURLToPath(url);

const reference=await sharp(file(new URL("reference-web-sakura-storm.jpg",screenshots)))
  .resize(width,height,{fit:"cover"})
  .png()
  .toBuffer();

const stageAt=async name=>sharp(file(new URL(name,screenshots)))
  .extract({left:293,top:112,width:684,height:427})
  .resize(width,height,{fit:"fill"})
  .png()
  .toBuffer();

const [stageA,stageB]=await Promise.all([
  stageAt("effects-rose-transparent-sakura.png"),
  stageAt("effects-rose-transparent-sakura-later.png")
]);

const [petalFront,petalCurl]=await Promise.all([
  sharp(file(new URL("assets/effects/shared/sakura-petal-v1.png",root))).resize(270,270,{fit:"contain"}).png().toBuffer(),
  sharp(file(new URL("assets/effects/shared/sakura-petal-curled-v1.png",root))).resize(270,270,{fit:"contain"}).png().toBuffer()
]);

const petals=await sharp({create:{width,height,channels:4,background:petalBackdrop}})
  .composite([
    {input:petalFront,left:25,top:65},
    {input:petalCurl,left:345,top:65}
  ])
  .png()
  .toBuffer();

await sharp({create:{width:width*2+gap,height:height*2+gap,channels:4,background:{r:247,g:246,b:243,alpha:1}}})
  .composite([
    {input:reference,left:0,top:0},
    {input:stageA,left:width+gap,top:0},
    {input:petals,left:0,top:height+gap},
    {input:stageB,left:width+gap,top:height+gap}
  ])
  .png()
  .toFile(file(new URL("design-qa-transparent-sakura-comparison.png",screenshots)));
