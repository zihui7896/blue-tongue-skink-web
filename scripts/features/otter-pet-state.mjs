const IDLE_STATE = Object.freeze({
  mood: "idle",
  message: "小獭抱着贝壳，安静陪你一会儿。",
});

const REACTIONS = Object.freeze({
  greet: Object.freeze({
    mood: "waving",
    message: "小獭挥挥爪：今天也一起加油呀！",
  }),
  snack: Object.freeze({
    mood: "snacking",
    message: "收到小鱼！小獭开心得冒出了泡泡。",
  }),
  rest: Object.freeze({
    mood: "sleeping",
    message: "小獭抱紧尾巴，进入了午睡时间。",
  }),
});

export function createOtterState() {
  return { ...IDLE_STATE };
}

export function reduceOtterState(state, action) {
  if (action === "rest" && state.mood === "sleeping") {
    return createOtterState();
  }

  const reaction = REACTIONS[action];
  return reaction ? { ...reaction } : state;
}
