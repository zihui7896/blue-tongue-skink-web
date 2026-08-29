import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  hashForView,
  normalizeView,
  viewFromHash,
} from "../scripts/components/sidebar.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("工作台为小獭提供侧边栏入口和独立面板", async () => {
  const html = await read("workspace.html");

  assert.match(html, /data-view="otter"/);
  assert.match(html, /data-view-panel="otter"/);
  assert.match(html, /data-otter-playground/);
  assert.match(html, /styles\/components\/otter-pet\.css/);
});

test("侧边栏支持小獭 hash 的双向路由", async () => {
  const sidebar = await read("scripts/components/sidebar.js");

  assert.match(sidebar, /otter:"小獭桌宠/);
  assert.match(sidebar, /"#otter"/);
  assert.equal(viewFromHash("#otter"), "otter");
  assert.equal(hashForView("otter"), "#otter");
  assert.equal(normalizeView("otter"), "otter");
  assert.equal(normalizeView("unknown"), "pet");
});

test("主入口初始化小獭互动组件", async () => {
  const main = await read("scripts/main.js");

  assert.match(main, /initOtterPet/);
  assert.match(main, /initOtterPet\(\)/);
});
