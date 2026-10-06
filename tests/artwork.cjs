const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { chromium } = require("playwright");
const server = spawn(process.execPath, ["scripts/preview.cjs"], {
  cwd: path.resolve(__dirname, ".."), env: { ...process.env, PORT: "4175" }, stdio: ["ignore", "pipe", "pipe"],
});
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.stdout.once("data", resolve); server.once("error", reject); server.once("exit", reject); });
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://localhost:4175/#work");
  await page.waitForSelector(".scene-live");
  await page.locator("#motion-toggle").click();
  await page.addStyleTag({ content: ".scene-toolbar { visibility: hidden !important; }" });
  for (const [key, file] of [["ai", "reference-work-art.png"], ["data", "reference-data-art.png"], ["fullstack", "reference-fullstack-art.png"]]) {
    await page.locator(`#tab-${key}`).click();
    await page.waitForSelector(`canvas[data-project="${key}"][data-ready="true"]`);
    assert.equal(await page.locator("canvas").getAttribute("data-texture"), `assets/${file}`);
    const rendered = await page.locator("canvas").screenshot();
    await page.locator(".reference-work-art").evaluate(async (img, file) => {
      img.src = `assets/${file}`;
      await img.decode();
      img.style.opacity = "1";
      document.querySelector("canvas").style.visibility = "hidden";
    }, file);
    const source = await page.locator(".reference-work-art").screenshot();
    const difference = await page.evaluate(async urls => {
      const pixels = await Promise.all(urls.map(async url => {
        const img = new Image(); img.src = url; await img.decode();
        const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
        const context = canvas.getContext("2d"); context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, img.width, img.height).data;
      }));
      if (pixels[0].length !== pixels[1].length) return Infinity;
      let error = 0, samples = 0;
      for (let i = 0; i < pixels[0].length; i++) if (i % 4 !== 3) { error += Math.abs(pixels[0][i] - pixels[1][i]); samples++; }
      return error / samples;
    }, [rendered, source].map(buffer => `data:image/png;base64,${buffer.toString("base64")}`));
    assert.ok(difference < 3, `${key} does not preserve its PNG: RGB error ${difference}`);
    console.log(`PASS ${key}: PNG fidelity, mean RGB difference ${difference.toFixed(3)} / 255`);
    await page.locator("canvas").evaluate(canvas => canvas.style.removeProperty("visibility"));
    await page.locator(".reference-work-art").evaluate(img => img.style.removeProperty("opacity"));
  }
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const image = await page.locator(".reference-work-art").boundingBox();
    const canvas = await page.locator("canvas").boundingBox();
    for (const dimension of ["x", "y", "width", "height"]) assert.ok(Math.abs(image[dimension] - canvas[dimension]) < 1, `Image/mesh alignment at ${width}: ${dimension}`);
  }
  console.log("PASS PNG mesh bounds follow the original image on phones, tablets and desktop");
  assert.deepEqual(errors, []);

  // Old, slow texture loads must never overwrite the most recent selection.
  const race = await browser.newPage();
  await race.route("**/reference-data-art.png", async route => {
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.continue();
  });
  await race.goto("http://localhost:4175/#work");
  await race.waitForSelector(".scene-live");
  await race.evaluate(() => {
    document.querySelector("#tab-data").click();
    document.querySelector("#tab-fullstack").click();
  });
  await race.waitForSelector('canvas[data-project="fullstack"][data-ready="true"]');
  await race.waitForTimeout(900);
  assert.equal(await race.locator("canvas").getAttribute("data-texture"), "assets/reference-fullstack-art.png");
  assert.equal(await race.locator("canvas").count(), 1);
  await race.close();
  console.log("PASS Rapid project changes retain the latest PNG and one renderer");

  const failure = await browser.newPage();
  await failure.route("**/reference-work-art.png", route => route.abort());
  await failure.goto("http://localhost:4175/#work");
  await failure.waitForTimeout(1000);
  assert.equal(await failure.locator(".scene-live").count(), 0);
  assert.equal(await failure.locator(".reference-work-art").evaluate(img => getComputedStyle(img).opacity), "1");
  await failure.locator('[data-stage="engine"]').click();
  assert.equal(await failure.locator("#detail-dialog").evaluate(dialog => dialog.open), true);
  console.log("PASS Failed PNG texture leaves the original artwork and stage buttons usable");
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.kill();
});
