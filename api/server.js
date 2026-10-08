// Retain compatibility with hosts that use this legacy entry point.
module.exports = require('../server');
// Vercel terminates HTTPS before forwarding to Express. Trust its immediate
// proxy so the shared chat handler compares Origin against the public protocol.
if (process.env.VERCEL === '1') module.exports.set('trust proxy', 1);
if (require.main === module) {
  module.exports.listen(process.env.PORT || 3000, () => console.log('Portfolio server ready.'));
}
