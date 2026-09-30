export const DIFFICULTIES = {
  normal: { label:'入门', summary:'熟悉操作 · 宽松判定', rank:0 },
  hard: { label:'挑战', summary:'窄判定 · 更多干扰', rank:1 },
  nightmare: { label:'噩梦', summary:'极限反应 · 极低容错', rank:2 },
};

// Rules and presentation share these values so that displayed goals match the game.
const RULES = {
  tutorial: [{time:30},{time:25},{time:20}],
  chase: [
    {time:35,hits:1,decoys:7,speed:1.9,lateSpeed:.7,cooldown:0,repel:0},
    {time:30,hits:3,decoys:10,speed:2.5,lateSpeed:1.55,cooldown:.4,repel:7},
    {time:25,hits:4,decoys:17,speed:3.7,lateSpeed:2.5,cooldown:.55,repel:14},
  ],
  popups: [{time:45,count:5,replacements:0,motion:0},{time:30,count:6,replacements:2,motion:2},{time:25,count:9,replacements:5,motion:6}],
  whack: [{time:35,hits:6,interval:1.1,bad:1,maxMisses:Infinity},{time:28,hits:10,interval:.72,bad:3,maxMisses:5},{time:22,hits:16,interval:.43,bad:4,maxMisses:2}],
  catch: [{time:45,goal:8,width:132,speed:155,spawn:.65,red:.33,lives:Infinity},{time:35,goal:12,width:104,speed:210,spawn:.5,red:.4,lives:3},{time:30,goal:16,width:72,speed:275,spawn:.34,red:.48,lives:2}],
  roulette: [{time:40,hits:3,arc:76,speed:100,increment:22},{time:32,hits:4,arc:44,speed:145,increment:23},{time:28,hits:5,arc:24,speed:190,increment:30}],
  slots: [{time:45,interval:.55,misses:Infinity},{time:32,interval:.28,misses:3},{time:25,interval:.16,misses:2}],
  memory: [{time:45,cups:3,rounds:2,show:1.8,swaps:4,duration:.85},{time:38,cups:4,rounds:3,show:1.5,swaps:6,duration:.55},{time:32,cups:5,rounds:3,show:.95,swaps:8,duration:.34}],
  breakout: [{time:75,columns:4,rows:2,width:150,speed:390,lives:3,armored:false},{time:75,columns:4,rows:3,width:110,speed:440,lives:2,armored:true},{time:70,columns:5,rows:3,width:78,speed:555,lives:1,armored:true}],
  flappy: [{time:45,goal:5,gap:176,speed:145,spacing:270,motion:0},{time:38,goal:8,gap:138,speed:182,spacing:235,motion:10},{time:32,goal:10,gap:100,speed:225,spacing:215,motion:19}],
  mash: [{time:40,gain:9,decay:8,minimum:5.5,green:1.5,warning:.35,red:.75,motion:35},{time:32,gain:7,decay:10,minimum:10,green:1.15,warning:.25,red:.85,motion:60},{time:28,gain:5.5,decay:14,minimum:15,green:.9,warning:.13,red:1,motion:85}],
  dodge: [{time:35,duration:14,shields:3,speed:175,interval:.85,spread:2,sides:false},{time:32,duration:18,shields:2,speed:210,interval:.88,spread:2,sides:true},{time:35,duration:24,shields:1,speed:265,interval:.62,spread:3,sides:true}],
  runner: [{time:40,speed:225,count:6,spacing:380,length:2950},{time:35,speed:285,count:11,spacing:340,length:4150},{time:35,speed:355,count:15,spacing:300,length:5150}],
};

export function challengeRules(id, difficulty='hard') {
  return RULES[id][DIFFICULTIES[difficulty]?.rank ?? 1];
}

export function challengeCopy(entry, difficulty='hard') {
  const p=challengeRules(entry.id,difficulty),rank=DIFFICULTIES[difficulty]?.rank??1;
  const hints={
    chase:`需要抓到 ${p.hits} 次。每次抓到后按钮会换位置，${rank?'不会很快停下来。':'等它慢下来再点。'}`,
    popups:`共有 ${p.count+p.replacements} 个弹窗，其中 ${p.replacements} 个会在关闭后补出来。只点标题栏的 ×。`,
    whack:`要命中 ${p.hits} 次，每轮露头 ${p.interval} 秒。${rank?`最多漏掉 ${p.maxMisses} 次。`:'漏掉不会失败。'}看文字再点。`,
    catch:`绿色 +1，红色扣 2。${rank?`接错 ${p.lives} 次就失败。`:'不必接住每一个。'}提前看落点。`,
    roulette:`绿色区域只有 ${p.arc}°，约占整圈 ${Math.round(p.arc/3.6)}%。需要连续命中 ${p.hits} 次。`,
    slots:`同意每次停留约 ${Math.round(p.interval*1000)} 毫秒。${rank?`停错累计 ${p.misses} 次就失败。`:'停错可单独重转。'}`,
    memory:`${p.cups} 个盒子，完成 ${p.rounds} 轮。每轮至少交换 ${p.swaps} 次，盯住绿色盒子。`,
    breakout:`挡板宽 ${p.width}，共 ${p.lives} 条生命。${p.armored?'深色砖块需要击中两次。':''}用挡板两侧改变球路。`,
    flappy:`飞过 ${p.goal} 道门，门洞宽 ${p.gap}。${rank?'门洞会缓慢上下移动，注意下一道的位置。':'用规律节奏保持高度。'}`,
    mash:`每次同意 +${p.gain}%，每秒回落 ${p.decay}%。至少坚持 ${p.minimum} 秒；黄色预警只有 ${Math.round(p.warning*1000)} 毫秒。`,
    dodge:`存活 ${p.duration} 秒，${p.shields} 层护盾。${rank?'攻击会轮流从顶部、左右两侧进入，后半程加密。':'保持移动。'}`,
    runner:`跑速 ${p.speed}，共 ${p.count} 个障碍。后半程会加速，障碍变宽；临近时再起跳。`,
  };
  const descriptions={
    chase:`同意按钮会逃跑，还混在 ${p.decoys} 个不同意中。成功抓住 ${p.hits} 次才能通过。`,
    whack:`在越来越快的九宫格里抓到 ${p.hits} 次同意。${rank?`漏掉超过 ${p.maxMisses} 次，协议作废。`:''}`,
    catch:`用${rank?'更小的':''}接盘收集 ${p.goal} 份同意，避开落下的不同意。`,
    roulette:`在 ${p.arc}° 的绿色区域内停下转盘，连续命中 ${p.hits} 次。每轮加速并反转。`,
    memory:`在 ${p.cups} 个不断换位的盒子中找回同意，完成 ${p.rounds} 轮。`,
    flappy:`穿过 ${p.goal} 道${rank?'移动的':''}门。门洞更窄，碰到拒绝条款即失败。`,
    dodge:`抵挡${rank?'多方向':''}不同意弹幕，保护光标 ${p.duration} 秒。你只有 ${p.shields} 层护盾。`,
    runner:`跳过 ${p.count} 个障碍，到达终点。${rank?'后半段会加速，':''}请看准距离。`,
  };
  return {...entry,time:p.time,hint:hints[entry.id]||entry.hint,description:descriptions[entry.id]||entry.description,controls:entry.id==='memory'?`看完洗牌再点盒子；键盘按 1—${p.cups} 选择位置。`:entry.controls};
}
