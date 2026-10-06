import chat from '../../lib/chat.cjs';

export default async function handler(request) {
  return chat.handleChat(request);
}

export const config = {
  path: '/chat',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
