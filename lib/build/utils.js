/**
 * Utils to help with building things
 */

const fs = require('fs');
const pathUtils = require('path');
const Readable = require('stream').Readable;

const testDir = pathUtils.resolve(__dirname, '..', '..', 'tests');

const readDir = path => fs.readdirSync(path).map(file => pathUtils.resolve(path, file));
const isDir = path => fs.statSync(path).isDirectory();
const toRelative = path => pathUtils.relative(testDir, path);

const readFile = exports.readFile = path => fs.readFileSync(path, { encoding: 'utf8' }).trim();

const tests = exports.tests = [];

/**
 * Convert a string to a stream
 */
exports.toStream = function toStream(string) {
  const stream = new Readable();
  stream.push(string);
  stream.push(null);
  return stream;
};

/**
 * Validate a test has a spec and docs
 */
function validateTest(test) {
  if (!test.specPath) {
    console.warn(`missing spec.js for ${test.name}`);
  }

  if (!test.docPath) {
    console.warn(`missing doc.md for ${test.name}`);
  }
}

// Find all tests
(function findTests(dir) {
  const found = { name: toRelative(dir) };

  readDir(dir).forEach((path) => {
    if (isDir(path)) {
      findTests(path);
      return;
    }

    const name = pathUtils.basename(path);
    if (name === 'test.js') {
      found.testPath = path;
    } else if (name === 'spec.js') {
      found.specPath = path;
    } else if (name === 'doc.md') {
      found.docPath = path;
    }
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
  return `const tests = module.exports = new Map();
    let name;
    const { $, $$, cssEscape } = require('./utils');
    const defineTest = test => tests.set(name, test);
    ${tests.map(test => (
      `name = ${JSON.stringify(test.name)};\n${readFile(test.testPath)}`)
    ).join('\n')}
  `;
};
