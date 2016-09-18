/**
 * Utils to help with building things
 */

const fs = require('fs');
const pathUtils = require('path');
const Readable = require('stream').Readable;

const readDir = path => fs.readdirSync(path).map(file => pathUtils.resolve(path, file));
const isDir = path => fs.statSync(path).isDirectory();

const testDir = pathUtils.resolve(__dirname, '..', 'tests');

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
    console.warn(`missing spec.js for ${test.dir}`);
  }

  if (!test.docPath) {
    console.warn(`missing doc.md for ${test.dir}`);
  }
}

// Find all tests
(function findTests(dir) {
  const found = { dir, test: null, spec: null, doc: null };

  readDir(dir).forEach(path => {
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
  return `const tests = module.exports = [];
    const defineTest = test => tests.push(test);
    ${tests.map(test => fs.readFileSync(test.testPath, { encoding: 'utf8' })).join('\n')}
  `;
};
