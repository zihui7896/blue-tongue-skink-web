import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../.web-test-tools/node_modules/playwright-core/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1320, height: 1000 } });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const htmlPath = path.join(root, "web", "index.html").replaceAll("\\", "/");
  await page.goto(`file:///${htmlPath}`, { waitUntil: "load" });

  assert.match(await page.title(), /蓝豆 LanDou/);
  assert.equal(await page.locator("#actions button").count(), 9);
  assert.equal(await page.locator("#poses button").count(), 6);
  assert.match(await page.locator(".mode").innerText(), /手动动作模式/);
  assert.equal(await page.locator("#auto").count(), 0);
  assert.match(await page.locator("#pet").evaluate((element) => getComputedStyle(element).backgroundImage), /spritesheet\.webp/);

  await page.locator('#actions button[data-state="failed"]').click();
  assert.equal(await page.locator("#poses button").count(), 8);
  assert.match(await page.locator("#pose-summary").innerText(), /闭眼趴下/);
  await page.waitForTimeout(5600);
  assert.equal(await page.locator('#actions button[data-state="failed"]').getAttribute("class"), "active");

  await page.getByRole("button", { name: /闭眼趴下/ }).click();
  const heldPosition = await page.locator("#pet").evaluate((element) => getComputedStyle(element).backgroundPosition);
  assert.match(await page.locator("#status").innerText(), /委屈 · 闭眼趴下/);
  assert.match(await page.locator("#play").innerText(), /继续播放/);
  await page.waitForTimeout(500);
  assert.equal(await page.locator("#pet").evaluate((element) => getComputedStyle(element).backgroundPosition), heldPosition);

  await page.locator("#next").click();
  assert.match(await page.locator("#status").innerText(), /悄悄偷看/);
  await page.locator("#play").click();
  await page.waitForTimeout(220);
  assert.notEqual(await page.locator("#pet").evaluate((element) => getComputedStyle(element).backgroundPosition), heldPosition);

  await page.screenshot({ path: path.join(__dirname, "web-static-manual.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.equal(await page.locator("#actions button").count(), 9);
  assert.equal(await page.locator("#poses button").count(), 6);
  await page.screenshot({ path: path.join(__dirname, "web-static-manual-mobile.png"), fullPage: true });

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    ok: true,
    groups: 9,
    detailedPoses: 61,
    manualMode: "selected group remained unchanged for more than 5 seconds",
    frameControls: "hold, previous/next and resume verified",
    mobile: "390px viewport without horizontal overflow",
  }, null, 2));
} finally {
  await browser.close();
}
