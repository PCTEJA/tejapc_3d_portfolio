const { test } = require('node:test');
const assert = require('node:assert/strict');

test('Vercel proxy accepts same-origin HTTPS chat and rejects cross-site requests', async (t) => {
  process.env.VERCEL = '1';
  process.env.GEMINI_API_KEY = 'test-only-secret';
  const app = require('../api/server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const fetchRequest = global.fetch;
  let providerCalls = 0;
  global.fetch = async () => {
    providerCalls++;
    return Response.json({ candidates: [{ finishReason: 'STOP', content: {
      parts: [{ text: 'Teja builds AI and data systems.' }],
    } }] });
  };
  t.after(async () => {
    global.fetch = fetchRequest;
    delete process.env.VERCEL;
    delete process.env.GEMINI_API_KEY;
    await new Promise(resolve => server.close(resolve));
  });
  const host = `127.0.0.1:${server.address().port}`;
  const send = (origin, fetchSite = 'same-origin') => fetchRequest(`http://${host}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https',
      origin, 'sec-fetch-site': fetchSite },
    body: JSON.stringify({ message: 'What does Teja do?' }),
  });
  const response = await send(`https://${host}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal((await send('https://attacker.example')).status, 403);
  assert.equal((await send(`https://${host}`, 'cross-site')).status, 403);
  assert.equal(providerCalls, 1);
});
