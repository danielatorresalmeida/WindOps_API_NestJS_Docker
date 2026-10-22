// Keep integration tests separate from the existing five unit tests.
const unitConfig = require('./package.json').jest;

module.exports = {
  ...unitConfig,
  testRegex: '.*\\.int-spec\\.ts$',
  testTimeout: 60000,
  collectCoverage: false,
};
