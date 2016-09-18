/**
 * The build process will generate a pre-built index of tests rather than using this file
 */
const buildUtils = require('./build/utils');

// eslint-disable-next-line global-require
module.exports = buildUtils.tests.map(test => require(test.testPath));

