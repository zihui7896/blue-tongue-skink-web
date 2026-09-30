const WIDTH = 800, HEIGHT = 680, SCALE = 1.5, SAMPLE = 500;
const clamp = v => Math.max(0, Math.min(1, v));
function layer() {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE; canvas.height = HEIGHT * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

// Prepare continuous contour chains once, rather than moving hundreds of SVG masks.
function trace(mask, size, phase) {
  const used = new Uint8Array(mask.length), paths = [];
  const offsets = [-size, 1, size, -1, -size+1, size+1, size-1, -size-1];
  for (let first = size+1; first < mask.length-size-1; first++) {
    if (!mask[first] || used[first]) continue;
    const points = [];
    let current = first;
    while (current >= 0 && points.length < 5000) {
      used[current] = 1;
      points.push([current % size, Math.floor(current / size)]);
      const next = offsets.map(offset => current + offset).find(index => mask[index] && !used[index]);
      current = next ?? -1;
    }
    if (points.length < (phase === 0 ? 14 : 9)) continue;
    const cleaned = points.filter((_, index) => index % 2 === 0 || index === points.length-1).map((point, index, values) => {
      const before = values[Math.max(0, index-1)], after = values[Math.min(values.length-1, index+1)];
      return [60 + (before[0] + point[0]*2 + after[0]) / 4 / size * 680,
        (before[1] + point[1]*2 + after[1]) / 4 / size * 680];
    });
    const middle = cleaned[Math.floor(cleaned.length / 2)];
    const decorative = middle[1] > 460 && (middle[0] < 275 || middle[0] > 525);
    paths.push({ points: cleaned, phase: decorative ? 2 : phase });
  }
  return paths.sort((a, b) => a.phase-b.phase || b.points.length-a.points.length);
}

function findContours(image) {
  const sample = document.createElement('canvas');
  sample.width = sample.height = SAMPLE;
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);
  const pixels = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  const count = SAMPLE*SAMPLE, luminance = new Float32Array(count), alpha = new Uint8Array(count);
  for (let i=0; i<count; i++) {
    const a = pixels[i*4+3] / 255;
    luminance[i] = (pixels[i*4]*.299 + pixels[i*4+1]*.587 + pixels[i*4+2]*.114)*a + 255*(1-a);
    alpha[i] = a > .24 ? 1 : 0;
  }
  const outer = new Uint8Array(count), magnitude = new Float32Array(count), directions = new Uint8Array(count);
  for (let y=1; y<SAMPLE-1; y++) for (let x=1; x<SAMPLE-1; x++) {
    const i=y*SAMPLE+x;
    if (alpha[i] && (!alpha[i-1] || !alpha[i+1] || !alpha[i-SAMPLE] || !alpha[i+SAMPLE])) outer[i]=1;
    const gx = -luminance[i-SAMPLE-1]-2*luminance[i-1]-luminance[i+SAMPLE-1]+luminance[i-SAMPLE+1]+2*luminance[i+1]+luminance[i+SAMPLE+1];
    const gy = -luminance[i-SAMPLE-1]-2*luminance[i-SAMPLE]-luminance[i-SAMPLE+1]+luminance[i+SAMPLE-1]+2*luminance[i+SAMPLE]+luminance[i+SAMPLE+1];
    magnitude[i] = Math.hypot(gx, gy);
    directions[i] = ((Math.round(Math.atan2(gy, gx) / (Math.PI / 4)) + 4) % 4);
  }
  const edges = new Uint8Array(count), offsets = [1, SAMPLE+1, SAMPLE, SAMPLE-1];
  for (let i=SAMPLE+1; i<count-SAMPLE-1; i++) {
    const offset=offsets[directions[i]], strength=magnitude[i];
    if (strength > 95 && strength >= magnitude[i-offset] && strength >= magnitude[i+offset] && luminance[i] < 225 && alpha[i]) edges[i]=1;
  }
  // Prevent doubling the outside silhouette with the image's own ink contour.
  for(let i=SAMPLE*2+2;i<count-SAMPLE*2-2;i++) if(outer[i]) {
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)edges[i+dy*SAMPLE+dx]=0;
  }
  return [...trace(outer, SAMPLE, 0), ...trace(edges, SAMPLE, 1)].sort((a,b)=>a.phase-b.phase||b.points.length-a.points.length);
}

function timeline(paths) {
  const totals=[0,0,0], segments=[];
  paths.forEach(path => {
    for(let i=1;i<path.points.length;i++) {
      const from=path.points[i-1], to=path.points[i];
      const length=Math.hypot(to[0]-from[0],to[1]-from[1]);
      if(!length)continue;
      segments.push({from,to,length,phase:path.phase,start:totals[path.phase]});
      totals[path.phase]+=length;
    }
  });
  const boundaries=[0,.32,.67,.8];
  // Sparse images may have no separate flower chains; don't leave a dead phase.
  if(!totals[2])boundaries[2]=.8;
  if(!totals[0])boundaries[1]=0;
  return segments.map(segment=>({ ...segment,
    begin:boundaries[segment.phase]+segment.start/totals[segment.phase]*(boundaries[segment.phase+1]-boundaries[segment.phase]),
    end:boundaries[segment.phase]+(segment.start+segment.length)/totals[segment.phase]*(boundaries[segment.phase+1]-boundaries[segment.phase]),
  }));
}

export async function createSketchPainter(imageURL, canvas) {
  const image = new Image();
  image.src = imageURL;
  await image.decode();
  // Let the loading label paint before the one-off contour extraction.
  await new Promise(resolve => requestAnimationFrame(resolve));
  const segments=timeline(findContours(image));
  if(!segments.length)throw new Error('No drawable image contours');
  const paper=layer(), ink=layer(), color=layer(), mask=layer(), composite=layer();
  paper.ctx.fillStyle='#fffdf8';paper.ctx.fillRect(0,0,WIDTH,HEIGHT);
  let seed=7;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<20000;i++) {
    paper.ctx.fillStyle=`rgba(119,102,79,${.016+random()*.035})`;
    paper.ctx.fillRect(random()*WIDTH,random()*HEIGHT,.4+random()*.5,.4+random()*.5);
  }
  color.ctx.drawImage(image,60,0,680,680);
  ink.ctx.strokeStyle='#71655e';ink.ctx.lineWidth=.78;ink.ctx.lineCap='round';ink.ctx.lineJoin='round';
  mask.ctx.strokeStyle='#fff';mask.ctx.lineWidth=48;mask.ctx.lineCap='round';
  // Feather each newly painted stroke once, keeping the cached wash edge soft.
  mask.ctx.shadowColor='#fff';mask.ctx.shadowBlur=24;
  canvas.width=WIDTH*SCALE;canvas.height=HEIGHT*SCALE;
  const ctx=canvas.getContext('2d');
  let previous=0, cursor=0, wash=0;
  const rows=Array.from({length:27},(_,i)=>i%2===0?13+i/2:13-(i+1)/2);

  function clear() {
    ink.ctx.clearRect(0,0,WIDTH,HEIGHT);mask.ctx.clearRect(0,0,WIDTH,HEIGHT);
    previous=0;cursor=0;wash=0;
  }

  function draw(value) {
    const progress=clamp(value);
    if(progress<previous)clear();
    for(;cursor<segments.length;cursor++) {
      const segment=segments[cursor];
      if(progress<=segment.begin)break;
      const a=clamp((previous-segment.begin)/(segment.end-segment.begin));
      const b=clamp((progress-segment.begin)/(segment.end-segment.begin));
      if(b>a) {
        const {from,to}=segment;
        ink.ctx.beginPath();
        ink.ctx.moveTo(from[0]+(to[0]-from[0])*a,from[1]+(to[1]-from[1])*a);
        ink.ctx.lineTo(from[0]+(to[0]-from[0])*b,from[1]+(to[1]-from[1])*b);
        ink.ctx.stroke();
      }
      if(progress<segment.end)break;
    }
    const newWash=clamp((progress-.8)/.2);
    if(newWash>wash) {
      for(let band=Math.floor(wash*27);band<Math.min(27,Math.ceil(newWash*27));band++) {
        const a=clamp(wash*27-band),b=clamp(newWash*27-band);
        const y=rows[band]*26,reverse=band%2;
        mask.ctx.beginPath();
        mask.ctx.moveTo(reverse?800*(1-a):800*a,y);
        mask.ctx.lineTo(reverse?800*(1-b):800*b,y+Math.sin(b*Math.PI)*8);
        mask.ctx.stroke();
      }
      if(newWash===1){mask.ctx.fillStyle='#fff';mask.ctx.fillRect(0,0,WIDTH,HEIGHT);}
      wash=newWash;
    }
    ctx.globalAlpha=1;ctx.drawImage(paper.canvas,0,0);
    ctx.globalAlpha=1-newWash;ctx.drawImage(ink.canvas,0,0);ctx.globalAlpha=1;
    if(newWash>0) {
      composite.ctx.clearRect(0,0,WIDTH,HEIGHT);
      composite.ctx.globalCompositeOperation='source-over';
      composite.ctx.drawImage(color.canvas,0,0,WIDTH,HEIGHT);
      composite.ctx.globalCompositeOperation='destination-in';
      composite.ctx.drawImage(mask.canvas,0,0,WIDTH,HEIGHT);
      composite.ctx.globalCompositeOperation='source-over';
      ctx.drawImage(composite.canvas,0,0);
    }
    previous=progress;
  }
  return { draw, segmentCount:segments.length };
}
