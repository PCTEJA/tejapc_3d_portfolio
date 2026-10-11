const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");
const path = require("node:path");

const server = spawn(process.execPath, ["scripts/preview.cjs"], {
  cwd: path.resolve(__dirname, ".."),
  env: { ...process.env, PORT: "4177" },
  stdio: ["ignore", "pipe", "inherit"],
});
const ready = new Promise((resolve, reject) => {
  server.stdout.once("data", resolve);
  server.once("error", reject);
});
let browser;
(async () => {
  await ready;
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const chapter = index => page.waitForFunction(index => {
    const track = document.querySelector("#panel-track");
    return Math.abs(track.scrollLeft - track.clientWidth * index) < 2;
  }, index);
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 600], [844, 390], [390, 844], [320, 568], [768, 1024]]) {
    await page.setViewportSize({ width, height });
    await page.goto("http://127.0.0.1:4177");
    await page.locator('[data-project-jump="zhuddle"]').click();
    await chapter(1);
    await page.evaluate(() => document.fonts.ready);
    const video = page.locator("#zhuddle-video");
    await video.evaluate(v => v.readyState ? null : new Promise(resolve => v.addEventListener("loadedmetadata", resolve, { once: true })));
    const fits = await page.evaluate(() => {
      const panel = document.querySelector("#work");
      const bounds = panel.getBoundingClientRect();
      const selectors = [".work-sidebar", ".project-heading", ".zhuddle-film", "video"];
      return {
        overflow: panel.scrollHeight - panel.clientHeight,
        clipped: selectors.filter(selector => {
          const rect = panel.querySelector(selector).getBoundingClientRect();
          return rect.height <= 0 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1 || rect.right > bounds.right + 1;
        }),
        objectFit: getComputedStyle(panel.querySelector("video")).objectFit,
      };
    });
    assert.ok(fits.overflow <= 1, `${width}×${height}: vertical overflow ${fits.overflow}`);
    assert.deepEqual(fits.clipped, [], `${width}×${height}: clipped content`);
    assert.equal(fits.objectFit, "contain");
    const box = await video.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await chapter(2);
    assert.equal(await page.locator("#work").evaluate(panel => panel.scrollTop), 0);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await page.locator('.chapter-nav a[href="#work"]').click();
    await chapter(1);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -120);
    await chapter(0);
    console.log(`PASS Zhuddle fits ${width}×${height}; wheel over video navigates horizontally both ways`);
  }
  await page.locator('[data-project-jump="zhuddle"]').click();
  await chapter(1);
  await page.locator("video").evaluate(v => v.play());
  await page.waitForFunction(() => document.querySelector("video").ended, null, { timeout: 20000 });
  assert.deepEqual(errors, []);
  console.log("PASS Complete video playback and no browser errors");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
  server.kill();
});
