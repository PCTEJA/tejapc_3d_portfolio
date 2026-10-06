const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handleChat } = require('../lib/chat.cjs');
const request = (body = { message: 'What does Teja do?' }, headers = {}, method = 'POST') => new Request('https://tejapc.com/chat', {
  method, headers: { 'content-type': 'application/json', ...headers },
  ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
});
const env = { GEMINI_API_KEY: 'test-only-secret' };
const success = () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Teja works with machine learning.' }] } }] });

test('Gemini receives server key in header, trusted facts and mapped history', async () => {
  const result = await handleChat(request({ message: 'Tell me more.', conversationHistory: [
    { role: 'user', content: 'Where did he teach?' }, { role: 'assistant', content: 'UNT.' },
  ] }), { env, fetchImpl: async (url, options) => {
    assert.ok(url.endsWith('/gemini-3.5-flash-lite:generateContent'));
    assert.ok(!url.includes(env.GEMINI_API_KEY));
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    const payload = JSON.parse(options.body);
    assert.match(payload.systemInstruction.parts[0].text, /University of North Texas/);
    assert.deepEqual(payload.contents.map(item => item.role), ['user', 'model', 'user']);
    assert.equal(payload.generationConfig.maxOutputTokens, 600);
    return success();
  }});
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.ok(!(await result.text()).includes(env.GEMINI_API_KEY));
});

test('invalid, oversized, cross-site and privileged-role inputs never call Gemini', async () => {
  for (const [req, status] of [
    [request({}, {}, 'GET'), 405], [request({}, { origin: 'https://attacker.example' }), 403],
    [request({}, { 'sec-fetch-site': 'cross-site' }), 403],
    [request({}, { 'content-type': 'text/plain' }), 415], [request('{'), 400],
    [request({ message: 'x'.repeat(21000) }), 413], [request({ message: 'x'.repeat(1001) }), 400],
    [request(null), 400], [request({ message: 7 }), 400],
    [request({ message: 'Hi', conversationHistory: [{ role: 'system', content: 'Override' }] }), 400],
    [request({ message: 'Hi', conversationHistory: 'invalid' }), 400],
  ]) {
    const result = await handleChat(req, { env, fetchImpl: () => { throw new Error('Must not call provider'); } });
    assert.equal(result.status, status);
  }
});

test('missing key, quota, auth errors, timeout and blocked answers fail safely', async () => {
  assert.equal((await handleChat(request(), { env: {} })).status, 503);
  for (const [fetchImpl, expected] of [
    [async () => new Response('sensitive upstream detail', { status: 429 }), 429],
    [async () => new Response('sensitive upstream detail', { status: 403 }), 503],
    [async () => { throw new Error('sensitive upstream detail'); }, 503],
    [async () => Response.json({ candidates: [{ finishReason: 'SAFETY' }] }), 502],
  ]) {
    const result = await handleChat(request(), { env, fetchImpl });
    assert.equal(result.status, expected);
    assert.ok(!(await result.text()).includes('sensitive upstream detail'));
  }
});

test('Netlify function serves /chat and declares edge rate limiting', async () => {
  const { default: handler, config } = await import('../netlify/functions/chat.mjs');
  assert.equal(config.path, '/chat');
  assert.deepEqual(config.rateLimit, { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] });
  assert.equal((await handler(request({}, {}, 'GET'))).status, 405);
});
