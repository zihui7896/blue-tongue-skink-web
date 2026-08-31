import sharp from "sharp";
import {fileURLToPath} from "node:url";

const root=new URL("../../",import.meta.url);
const screenshots=new URL("assets/screenshots/",root);
const panelWidth=640;
const panelHeight=400;
const gap=20;
const background={r:23,g:39,b:36,alpha:1};

async function sourcePanel(path){
  return sharp(fileURLToPath(new URL(path,root)))
    .resize(panelWidth,panelHeight,{fit:"contain",background})
    .flatten({background})
    .png()
    .toBuffer();
}

async function implementationPanel(file,crop){
  return sharp(fileURLToPath(new URL(file,screenshots)))
    .extract(crop)
    .resize(panelWidth,panelHeight,{fit:"fill"})
    .png()
    .toBuffer();
}

const panels=await Promise.all([
  sourcePanel("assets/effects/blooming-flower/flower-natural-v2.png"),
  implementationPanel("effects-peony-natural-final-v2.png",{left:293,top:269,width:684,height:427}),
  sourcePanel("assets/effects/blooming-rose/rose-natural-v2.png"),
  implementationPanel("effects-rose-natural-final.png",{left:293,top:111,width:684,height:426})
]);

await sharp({create:{width:panelWidth*2+gap,height:panelHeight*2+gap,channels:4,background:{r:245,g:244,b:240,alpha:1}}})
  .composite([
    {input:panels[0],left:0,top:0},
    {input:panels[1],left:panelWidth+gap,top:0},
    {input:panels[2],left:0,top:panelHeight+gap},
    {input:panels[3],left:panelWidth+gap,top:panelHeight+gap}
  ])
  .png()
  .toFile(fileURLToPath(new URL("design-qa-natural-flower-comparison.png",screenshots)));
