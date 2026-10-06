const express = require('express');
const path = require('node:path');
const { handleChat } = require('./lib/chat.cjs');
require('dotenv').config();
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.post('/chat', async (req, res) => {
  const headers = { 'content-type': req.get('content-type') || '' };
  for (const name of ['origin', 'sec-fetch-site']) {
    if (req.get(name)) headers[name] = req.get(name);
  }
  const response = await handleChat(new Request(`${req.protocol}://${req.get('host')}/chat`, {
    method: 'POST', headers, body: JSON.stringify(req.body),
  }));
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
});
app.all('/chat', (req, res) => res.set('Allow', 'POST').status(405).json({ error: 'Use POST.' }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((error, req, res, next) => {
  res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid or oversized request.' });
});
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => console.log('Portfolio server ready.'));
}
module.exports = app;
