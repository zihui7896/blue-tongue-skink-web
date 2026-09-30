export const SKETCH_CHARACTERS = [
  { id: 'cat', name: '猫咪', subtitle: '花园里的小橘猫', accent: '#dda46f' },
  { id: 'skink', name: '蓝舌石龙子', subtitle: '蓝豆的午后花园', accent: '#b6ac89' },
  { id: 'panda', name: '熊猫', subtitle: '把竹林抱进怀里', accent: '#a0af94' },
  { id: 'watermelon', name: '西瓜', subtitle: '夏天的一口甜', accent: '#efa299' },
  { id: 'peach', name: '桃子', subtitle: '桃子也有好心情', accent: '#eeb4a3' },
  { id: 'rabbit', name: '小兔', subtitle: '收集春天的小兔', accent: '#d4beb2' },
].map(character => ({ ...character, image: `assets/sketch-v2/${character.id}.png` }));