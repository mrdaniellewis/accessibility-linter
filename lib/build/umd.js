/**
 * Build the umd linter
 */
const pathUtils = require('path');

const { generateTestIndex, toStream } = require('./utils');
const browserify = require('browserify');

const b = browserify({
  standalone: 'AccessibilityLinter',
  transform: ['strictify'],
  debug: true,
});

b.exclude('./tests');
b.add(toStream(generateTestIndex()), {
  basedir: pathUtils.resolve(__dirname, '..'),
  expose: './tests' }
);
b.add(pathUtils.resolve(__dirname, '..', 'linter.js'));
b.bundle().pipe(process.stdout);

