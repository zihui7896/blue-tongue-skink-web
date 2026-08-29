import test from "node:test";
import assert from "node:assert/strict";

import {
  createOtterState,
  reduceOtterState,
} from "../scripts/features/otter-pet-state.js";

test("小獭默认安静地抱着贝壳", () => {
  assert.deepEqual(createOtterState(), {
    mood: "idle",
    message: "小獭抱着贝壳，安静陪你一会儿。",
  });
});

test("打招呼会让小獭挥爪回应", () => {
  assert.deepEqual(reduceOtterState(createOtterState(), "greet"), {
    mood: "waving",
    message: "小獭挥挥爪：今天也一起加油呀！",
  });
});

test("送小鱼会让小獭开心进食", () => {
  assert.deepEqual(reduceOtterState(createOtterState(), "snack"), {
    mood: "snacking",
    message: "收到小鱼！小獭开心得冒出了泡泡。",
  });
});

test("休息动作会在睡觉和醒来之间切换", () => {
  const sleeping = reduceOtterState(createOtterState(), "rest");
  assert.deepEqual(sleeping, {
    mood: "sleeping",
    message: "小獭抱紧尾巴，进入了午睡时间。",
  });
  assert.deepEqual(reduceOtterState(sleeping, "rest"), createOtterState());
});

test("未知动作保持当前状态", () => {
  const current = reduceOtterState(createOtterState(), "greet");
  assert.equal(reduceOtterState(current, "unknown"), current);
});
