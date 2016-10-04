/* eslint-disable global-require */
/**
 * The build process will generate a pre-built index of tests rather than using this file
 */
const buildUtils = require('./build/utils');

module.exports = buildUtils.tests.map(test => (
  Object.assign(require(test.testPath), { name: test.name })
));

