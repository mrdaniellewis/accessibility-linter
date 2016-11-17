/**
 * Utils to help with building things
 */

const fs = require('fs');
const pathUtils = require('path');
const Readable = require('stream').Readable;

const version = exports.version = require('../../package.json').version;

const testDir = pathUtils.resolve(__dirname, '..', '..', 'tests');

const readDir = path => fs.readdirSync(path).map(file => pathUtils.resolve(path, file));
const isDir = path => fs.statSync(path).isDirectory();
const toRelative = path => pathUtils.relative(testDir, path);

const readFile = exports.readFile = path => fs.readFileSync(
  pathUtils.resolve(__dirname, path),
  { encoding: 'utf8' }
).trim();

const toSource = ob => JSON.stringify(ob);

/**
 * Convert a string to a stream
 */
exports.toStream = function toStream(string) {
  const stream = new Readable();
  stream.push(string);
  stream.push(null);
  return stream;
};

const tests = exports.tests = [];

/**
 * Validate a test has a spec
 */
function validateTest(test) {
  if (!test.specPath) {
    console.warn(`missing spec.js for ${test.name}`);
  }
}

// Find all tests
(function findTests(dir) {
  const found = { name: toRelative(dir) };
  const files = readDir(dir);

  files.forEach((path) => {
    // Check files
    if (isDir(path)) {
      return;
    }

    const name = pathUtils.basename(path);
    if (name === 'test.js') {
      found.testPath = path;
    } else if (name === 'spec.js') {
      found.specPath = path;
    }
  });

  files.forEach((path) => {
    // Check directories
    if (!isDir(path)) {
      return;
    }
    findTests(path);
  });

  if (found.testPath) {
    validateTest(found);
    tests.push(found);
  }
}(testDir));

/**
 * Returns the test index file
 */
exports.generateTestIndex = function generateTestIndex() {
  return `
    const { $, $$, cssEscape } = require('./utils');
    const rules = require('./rules');
    module.exports = new Map([
      ${tests.map(test => `[
        ${toSource(test.name)},
        Object.assign(
          { name: ${toSource(test.name)} },
          ${readFile(test.testPath).trim().replace(/;$/, '')}
        ),
      ]`).join(',')}
    ]);
  `;
};

exports.generateVersion = function generateVersion() {
  return `module.exports = ${toSource(version)}`;
};
