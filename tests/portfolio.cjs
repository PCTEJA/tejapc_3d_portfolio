const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const output = path.join(root, ".artifacts");
fs.mkdirSync(output, { recursive: true });
const port = "4174";
const server = spawn(process.execPath, ["scripts/preview.cjs"], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: ["ignore", "pipe", "pipe"],
});
const ready = new Promise((resolve, reject) => {
  server.stdout.once("data", resolve);
  server.once("error", reject);
  server.once("exit", (code) =>
    reject(new Error(`Preview server exited: ${code}`)),
  );
});
let browser;
const errors = [];
const checks = [];
const passed = (label) => {
  checks.push(label);
  console.log(`PASS ${label}`);
};

(async () => {
  await ready;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const chapter = async (index) =>
    page.waitForFunction(
      (index) =>
        Math.abs(
          document.querySelector("#panel-track").scrollLeft -
            document.querySelector("#panel-track").clientWidth * index,
        ) < 2,
      index,
      { timeout: 10000 },
    );
  await page.goto(`http://127.0.0.1:${port}`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".hero-portrait").evaluate((img) => img.decode());
  await page.waitForTimeout(1200);
  assert.equal(
    await page
      .locator(".hero-portrait")
      .evaluate((img) => img.naturalWidth > 0),
    true,
  );
  await page.screenshot({ path: path.join(output, "desktop-home.png") });
  passed("Desktop introduction and portrait load");

  await page.mouse.move(700, 420);
  await page.mouse.wheel(0, 120);
  await chapter(1);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  assert.equal(await page.locator("#page-number").textContent(), "02");
  await page.screenshot({ path: path.join(output, "desktop-work.png") });
  passed("A small vertical mouse-wheel gesture travels sideways to work");

  await page.getByRole("tab", { name: "Data Engineering" }).click();
  assert.equal(
    await page.locator("#project-title").textContent(),
    "Industrial Solar Forecasting",
  );
  await page.keyboard.press("ArrowDown");
  assert.equal(
    await page.locator("#project-title").textContent(),
    "Full-Stack LLM Integration",
  );
  await page.keyboard.press("Home");
  assert.equal(
    await page.locator("#project-title").textContent(),
    "AI Document Extraction",
  );
  await page
    .getByRole("button", {
      name: "Explore the AI extraction stage",
      exact: true,
    })
    .click();
  assert.equal(
    await page.locator("#detail-dialog").evaluate((dialog) => dialog.open),
    true,
  );
  assert.equal(
    await page.locator("#dialog-title").textContent(),
    "Intelligence at work",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator("#detail-dialog").evaluate((dialog) => dialog.open),
    false,
  );
  await page
    .getByRole("button", { name: "Explore project", exact: true })
    .click();
  assert.equal(
    await page.locator("#dialog-title").textContent(),
    "AI Document Extraction",
  );
  await page.getByRole("button", { name: "Close details" }).click();
  await page.locator("#next-project").click();
  assert.equal(
    await page.locator("#project-title").textContent(),
    "Industrial Solar Forecasting",
  );
  passed(
    "Project tabs, keyboard selection, pipeline stages, details, and next project",
  );

  for (const [index, name] of [
    [2, "experience"],
    [3, "about"],
    [4, "contact"],
  ]) {
    await page.locator(`.chapter-nav a[href="#${name}"]`).click();
    await chapter(index);
    const overflow = await page
      .locator(`#${name}`)
      .evaluate((panel) => ({
        x: panel.scrollWidth - panel.clientWidth,
        y: panel.scrollHeight - panel.clientHeight,
      }));
    assert.ok(
      overflow.x <= 1 && overflow.y <= 1,
      `${name} desktop overflow: ${JSON.stringify(overflow)}`,
    );
    await page.screenshot({ path: path.join(output, `desktop-${name}.png`) });
  }
  await page.locator('.chapter-nav a[href="#about"]').click();
  await chapter(3);
  await page.locator('[data-detail="research"]').click();
  assert.equal(await page.locator("#dialog-content .detail-list a").count(), 5);
  await page.keyboard.press("Escape");
  await page.locator('[data-detail="gallery"]').click();
  assert.equal(await page.locator("#dialog-content img").count(), 8);
  await page.keyboard.press("Escape");
  passed("All chapters fit desktop; research and gallery open");

  await page.getByRole("link", { name: "Teja PC, home" }).click();
  await chapter(0);
  await page.keyboard.press("End");
  await chapter(4);
  await page.keyboard.press("Home");
  await chapter(0);
  await page.getByRole("button", { name: "Pause ambient animation" }).click();
  assert.equal(
    await page
      .locator("body")
      .evaluate((body) => body.classList.contains("motion-paused")),
    true,
  );
  await page.getByRole("button", { name: "Resume ambient animation" }).click();
  passed("Keyboard chapter navigation and animation pause");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator('.chapter-nav a[href="#contact"]').click();
  await chapter(4);
  await page.getByRole("button", { name: "Copy email" }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    "pcteja2000@gmail.com",
  );
  passed("Copy-email interaction");

  await page.getByRole("button", { name: "Ask about Teja" }).click();
  await page.locator("#chat-input").fill("What does Teja work on?");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#chat-messages")
      .textContent.includes("unavailable right now"),
  );
  await page.route("**/chat", (route) =>
    route.fulfill({
      json: { response: "Teja builds ML pipelines and cloud-native systems." },
    }),
  );
  await page.locator("#chat-input").fill("Tell me about his work.");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#chat-messages")
      .textContent.includes("Teja builds ML pipelines"),
  );
  await page.keyboard.press("Escape");
  passed("Assistant unavailable state and mocked successful response");

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("link", { name: "Teja PC, home" }).click();
    await chapter(0);
    await page.screenshot({
      path: path.join(output, `home-${viewport.width}.png`),
    });
    await page.locator('.chapter-nav a[href="#work"]').click();
    await chapter(1);
    const height = await page
      .locator("#work")
      .evaluate((panel) => panel.scrollHeight - panel.clientHeight);
    assert.ok(height <= 1, `Work overflow at ${viewport.width}: ${height}`);
  }
  passed("Laptop and large desktop layouts");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Teja PC, home" }).click();
  await chapter(0);
  await page.screenshot({ path: path.join(output, "mobile-home.png") });
  for (const [index, name] of [
    [1, "work"],
    [2, "experience"],
    [3, "about"],
    [4, "contact"],
  ]) {
    await page.locator(`.chapter-nav a[href="#${name}"]`).click();
    await chapter(index);
    const width = await page
      .locator(`#${name}`)
      .evaluate((panel) => panel.scrollWidth - panel.clientWidth);
    assert.ok(width <= 1, `${name} mobile horizontal overflow: ${width}`);
    await page.screenshot({ path: path.join(output, `mobile-${name}.png`) });
  }
  await page.locator('.chapter-nav a[href="#experience"]').click();
  await chapter(2);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 220);
  await page.waitForTimeout(400);
  assert.ok(
    await page.locator("#experience").evaluate((panel) => panel.scrollTop > 0),
  );
  await chapter(2);
  passed("Mobile layouts and vertical scrolling inside a tall chapter");

  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  touchPage.on("pageerror", error => errors.push(error.message));
  await touchPage.goto(`http://127.0.0.1:${port}`);
  const touchSession = await touchPage.context().newCDPSession(touchPage);
  await touchSession.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 330, y: 480 }] });
  for (let x = 300; x >= 60; x -= 30) {
    await touchSession.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: 480 }] });
    await touchPage.waitForTimeout(20);
  }
  await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touchPage.waitForFunction(() => Math.abs(document.querySelector('#panel-track').scrollLeft - innerWidth) < 2);
  await touchPage.close();
  passed("Native touch swipe changes chapters");

  await page.setViewportSize({ width: 1024, height: 550 });
  await page.locator('.chapter-nav a[href="#work"]').click();
  await chapter(1);
  await page.mouse.move(620, 320);
  await page.mouse.wheel(0, 220);
  await page.waitForTimeout(400);
  assert.ok(await page.locator('#work').evaluate(panel => panel.scrollTop > 0));
  await chapter(1);
  passed("Short desktop windows keep overflowing content reachable");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "Teja PC, home" }).click();
  await chapter(0);
  assert.equal(
    await page
      .locator("body")
      .evaluate((body) => body.classList.contains("motion-paused")),
    true,
  );
  assert.equal(
    await page
      .locator(".ribbon-group")
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
    "none",
  );
  await page.locator('.chapter-nav a[href="#contact"]').click();
  await chapter(4);
  passed(
    "Reduced motion disables ambient animation and keeps navigation usable",
  );

  assert.deepEqual(errors, []);
  passed("No JavaScript runtime errors");
  fs.writeFileSync(
    path.join(output, "test-results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(
    `${checks.length} browser checks passed. Screenshots in .artifacts/.`,
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.kill();
  });
