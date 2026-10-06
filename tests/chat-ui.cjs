const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const server = spawn(process.execPath, ['scripts/preview.cjs'], {
  env: { ...process.env, PORT: '4175' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const requests = [];
  await page.route('**/chat', async route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 3) return route.fulfill({ status: 429, body: 'Rate limited' });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ response: 'Teja teaches Python. <img src=x onerror=alert(1)>' }) });
  });
  await page.goto('http://127.0.0.1:4175');
  await page.getByRole('button', { name: 'Ask about Teja', exact: true }).click();
  for (const question of ['What does Teja teach?', 'Where?', 'More?']) {
    await page.locator('#chat-input').fill(question);
    await page.getByRole('button', { name: 'Send question', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#chat-input').disabled);
  }
  assert.deepEqual(requests[0].conversationHistory, []);
  assert.equal(requests[1].conversationHistory.length, 2);
  assert.equal(requests[2].conversationHistory.length, 4);
  assert.equal(await page.locator('#chat-messages img').count(), 0);
  assert.match(await page.locator('#chat-messages').innerText(), /free-tier limit/);
  console.log('PASS assistant history, safe text rendering, rate-limit feedback and input recovery');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); server.kill();
});
