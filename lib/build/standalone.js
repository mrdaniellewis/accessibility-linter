/**
 * Build the standalone linter
 *
 * Outputs a umd module that will autorun and start the linter
 */
const pathUtils = require('path');

const { generateRuleIndex, generateVersion, toStream } = require('./utils');
const browserify = require('browserify');

const b = browserify({
  transform: ['strictify'],
  debug: true,
});

b.exclude('./rules');
b.add(toStream(generateRuleIndex()), {
  basedir: pathUtils.resolve(__dirname, '..'),
  expose: './rules' }
);

b.exclude('./version');
b.add(toStream(generateVersion()), {
  basedir: pathUtils.resolve(__dirname, '..'),
  expose: './version' }
);

b.add(pathUtils.resolve(__dirname, '..', 'index.js'));
b.bundle().pipe(process.stdout);
