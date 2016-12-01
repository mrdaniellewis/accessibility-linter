/**
 * Utils to help with building things
 */

const fs = require('fs');
const pathUtils = require('path');
const Readable = require('stream').Readable;

const version = exports.version = require('../../package.json').version;

const ruleDir = pathUtils.resolve(__dirname, '..', '..', 'rules');

const readDir = path => fs.readdirSync(path).map(file => pathUtils.resolve(path, file));
const isDir = path => fs.statSync(path).isDirectory();
const toRelative = path => pathUtils.relative(ruleDir, path);

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

const rules = exports.rules = [];

/**
 * Validate a rule has a spec
 */
function validateRule(rule) {
  if (!rule.specPath) {
    console.warn(`missing spec.js for ${rule.name}`);
  }
}

// Find all rules
(function findRules(dir) {
  const found = { name: toRelative(dir) };
  const files = readDir(dir);

  files.forEach((path) => {
    // Check files
    if (isDir(path)) {
      return;
    }

    const name = pathUtils.basename(path);
    if (name === 'rule.js') {
      found.rulePath = path;
    } else if (name === 'spec.js') {
      found.specPath = path;
    }
  });

  files.forEach((path) => {
    // Check directories
    if (!isDir(path)) {
      return;
    }
    findRules(path);
  });

  if (found.rulePath) {
    validateRule(found);
    rules.push(found);
  }
}(ruleDir));

/**
 * Returns the rule index file
 */
exports.generateRuleIndex = function generateRuleIndex() {
  return `
    const { $, $$, cssEscape } = require('./utils');
    const aria = require('./aria');
    const elements = require('./elements');
    module.exports = new Map([
      ${rules.map(rule => `[
        ${toSource(rule.name)},
        Object.assign(
          { name: ${toSource(rule.name)} },
          ${readFile(rule.rulePath).trim().replace(/;$/, '')}
        ),
      ]`).join(',')}
    ]);
  `;
};

exports.generateVersion = function generateVersion() {
  return `module.exports = ${toSource(version)}`;
};
