/**
 * Build the standalone linter
 *
 * Outputs a umd module that will autorun and start the linter
 */
const pathUtils = require('path');

const { tests, generateTestIndex, toStream } = require('./utils');
const browserify = require('browserify');

const b = browserify({
  standalone: 'accessibilityLinter',
  transform: ['strictify'],
  debug: true,
});

console.log(tests);

b.exclude('./tests');
b.add(toStream(generateTestIndex()), {
  basedir: pathUtils.resolve(__dirname, '..'),
  expose: './tests' }
);
b.add(pathUtils.resolve(__dirname, '..', 'index.js'));
b.bundle().pipe(process.stdout);

