import sharp from "sharp";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error("Usage: node remove-checkerboard.mjs <input> <output>");
}

const {data,info}=await sharp(inputPath).removeAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height,channels}=info;
const pixels=width*height;
const transparent=new Uint8Array(pixels);
const queue=new Int32Array(pixels);
let head=0;
let tail=0;

function isNeutralBackground(index){
  const offset=index*channels;
  const red=data[offset];
  const green=data[offset+1];
  const blue=data[offset+2];
  const minimum=Math.min(red,green,blue);
  const maximum=Math.max(red,green,blue);
  return minimum>=235&&maximum-minimum<=4;
}

function add(index){
  if(index<0||index>=pixels||transparent[index]||!isNeutralBackground(index)) return;
  transparent[index]=1;
  queue[tail++]=index;
}

for(let x=0;x<width;x+=1){
  add(x);
  add((height-1)*width+x);
}
for(let y=0;y<height;y+=1){
  add(y*width);
  add(y*width+width-1);
}

while(head<tail){
  const index=queue[head++];
  const x=index%width;
  const y=(index-x)/width;
  if(x>0) add(index-1);
  if(x<width-1) add(index+1);
  if(y>0) add(index-width);
  if(y<height-1) add(index+width);
}

const alpha=Buffer.alloc(pixels,255);
for(let index=0;index<pixels;index+=1){
  if(transparent[index]) alpha[index]=0;
}

await sharp(data,{raw:{width,height,channels}})
  .joinChannel(alpha,{raw:{width,height,channels:1}})
  .png()
  .toFile(outputPath);

console.log(`Removed ${tail} connected background pixels from ${inputPath}`);
