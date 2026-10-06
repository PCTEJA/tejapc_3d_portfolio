// Retain compatibility with hosts that use this legacy entry point.
module.exports = require('../server');
if (require.main === module) {
  module.exports.listen(process.env.PORT || 3000, () => console.log('Portfolio server ready.'));
}
