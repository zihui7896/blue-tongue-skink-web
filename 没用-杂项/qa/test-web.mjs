import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../.web-test-tools/node_modules/playwright-core/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, "..");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const errors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("http://localhost:3000/blue-tongue-skink.html", { waitUntil: "networkidle" });
    assert.match(await page.title(), /蓝豆 LanDou/);
    const actionRegion = page.getByRole("region", { name: "动作选择" });
    assert.equal(await actionRegion.getByRole("button").count(), 9);
    const pet = page.getByRole("button", { name: /蓝豆正在/ });
    assert.equal(await pet.isVisible(), true);
    assert.match(await pet.evaluate((element) => getComputedStyle(element).backgroundImage), /spritesheet\.webp/);

    await actionRegion.getByRole("button", { name: /委屈/ }).click();
    await page.waitForTimeout(180);
    assert.equal(await actionRegion.getByRole("button", { name: /委屈/ }).getAttribute("data-active"), "true");
    assert.equal(await page.getByRole("button", { name: /蓝豆正在委屈/ }).evaluate((element) => getComputedStyle(element).backgroundPositionY), "-1040px");

    await page.getByRole("button", { name: /蓝豆正在委屈/ }).dblclick();
    await page.waitForTimeout(180);
    assert.equal(await page.getByRole("button", { name: /蓝豆正在挥爪/ }).isVisible(), true);
    await page.getByRole("button", { name: /自动巡游/ }).click();
    assert.match(await page.getByRole("button", { name: /自动巡游/ }).innerText(), /关/);
    await page.screenshot({ path: path.join(__dirname, "web-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.getByRole("region", { name: "动作选择" }).getByRole("button").count(), 9);
    assert.equal(await page.getByRole("button", { name: /蓝豆正在/ }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    await page.screenshot({ path: path.join(__dirname, "web-mobile.png"), fullPage: true });

    const standalone = await browser.newPage({ viewport: { width: 1200, height: 850 } });
    const standalonePath = path.join(root, "web", "index.html").replaceAll("\\", "/");
    await standalone.goto(`file:///${standalonePath}`, { waitUntil: "load" });
    assert.match(await standalone.title(), /蓝豆 LanDou/);
    assert.equal(await standalone.locator("#actions button").count(), 9);
    assert.equal(await standalone.locator("#pet").isVisible(), true);
    assert.match(await standalone.locator("#pet").evaluate((element) => getComputedStyle(element).backgroundImage), /spritesheet\.webp/);
    await standalone.close();

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({
      ok: true,
      desktop: "9 actions, state switching, double-click wave, autoplay toggle",
      mobile: "390px viewport without horizontal overflow",
      standalone: "file:// launch and local spritesheet load",
      screenshots: [path.join(__dirname, "web-desktop.png"), path.join(__dirname, "web-mobile.png")],
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
