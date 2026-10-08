const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const fs = require('node:fs');
const server = spawn(process.execPath, ['scripts/preview.cjs'], {
  env: { ...process.env, PORT: '4175' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  fs.mkdirSync('.artifacts', { recursive: true });
  const answer = '**10/10 — I am 100% confident in recommending Teja.**\n\n' +
    '- **Foot Locker:** Almost $200,000 in API cost savings.\n' +
    '- **Cotality:** Almost 70% fewer man-hours and substantial cost savings.\n' +
    '- **NOW Pensions:** Migrated 10 million-plus records.\n\n' +
    'Teja brings **5 years of industry experience** with **14 months of internship experience**.\n\n' +
    '1. Practical AI and cloud delivery.\n2. Efficient data engineering.\n\n' +
    '<img src=x onerror=alert(1)> <script>alert(1)</script> [unsafe](javascript:alert(1))';
  const requests = [];
  await page.route('**/chat', async route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 3) return route.fulfill({ status: 429, body: 'Rate limited' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ response: answer }) });
  });
  await page.goto('http://127.0.0.1:4175');
  await page.getByRole('button', { name: 'Ask about Teja', exact: true }).click();
  const compact = await page.locator('#assistant-panel').boundingBox();
  await page.getByRole('button', { name: 'Expand assistant', exact: true }).click();
  const expanded = await page.locator('#assistant-panel').boundingBox();
  assert.ok(expanded.width > compact.width && expanded.height > compact.height);
  assert.equal(await page.locator('#assistant-resize').getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Restore assistant size', exact: true }).click();
  assert.equal((await page.locator('#assistant-panel').boundingBox()).width, compact.width);
  for (const question of ['What does Teja teach?', 'Where?', 'More?']) {
    await page.locator('#chat-input').fill(question);
    await page.getByRole('button', { name: 'Send question', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#chat-input').disabled);
  }
  assert.deepEqual(requests[0].conversationHistory, []);
  assert.equal(requests[1].conversationHistory.length, 2);
  assert.equal(requests[2].conversationHistory.length, 4);
  assert.equal(await page.locator('#chat-messages img').count(), 0);
  assert.equal(await page.locator('#chat-messages script, #chat-messages a').count(), 0);
  assert.equal(await page.locator('#chat-messages strong').count(), 12);
  assert.equal(await page.locator('#chat-messages ul li').count(), 6);
  assert.equal(await page.locator('#chat-messages ol li').count(), 4);
  assert.match(await page.locator('#chat-messages').innerText(), /<img src=x/);
  assert.match(await page.locator('#chat-messages').innerText(), /free-tier limit/);
  await page.locator('#chat-messages').evaluate(el => { el.scrollTop = 0; });
  await page.locator('#assistant-panel').screenshot({ path: '.artifacts/chat-compact.png' });
  await page.getByRole('button', { name: 'Expand assistant', exact: true }).click();
  await page.locator('#assistant-panel').screenshot({ path: '.artifacts/chat-expanded.png' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const expandedState of [true, false]) {
      if ((await page.locator('#assistant-resize').getAttribute('aria-pressed') === 'true') !== expandedState) {
        await page.locator('#assistant-resize').click();
      }
      const box = await page.locator('#assistant-panel').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
      const input = await page.locator('#chat-input').boundingBox();
      assert.ok(input.y >= box.y && input.y + input.height <= box.y + box.height);
      assert.ok(await page.locator('#chat-messages').evaluate(el => el.clientHeight > 0 && el.scrollWidth <= el.clientWidth));
    }
    if (viewport.width === 390) await page.locator('#assistant-panel').screenshot({ path: '.artifacts/chat-mobile.png' });
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#assistant-panel').isVisible(), false);
  assert.equal(await page.locator('#assistant-toggle').evaluate(el => el === document.activeElement), true);
  console.log('PASS assistant history, safe Markdown, resize/restore, mobile/landscape layouts, keyboard close, rate-limit feedback and input recovery');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); server.kill();
});
