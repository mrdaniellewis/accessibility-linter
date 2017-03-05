/**
 * Utils to help with building things
 */

const pathUtils = require('path');
const Readable = require('stream').Readable;

const glob = require('glob');

const ruleDir = pathUtils.resolve(__dirname, '..', 'rules');

const version = exports.version = require('../../package.json').version;

const retab = exports.retab = (string, { initial = 0, trim = true } = {}) => {
  const pos = string.indexOf('\n');
  if (pos === -1) {
    return '';
  }
  const remove = string.slice(pos + 1, /\S/.exec(string).index);
  const ret = string
    .replace(new RegExp(`^${remove}`, 'mg'), Array(initial + 1).join('  '))
    .replace(/^\s+$/mg, '');

  if (trim) {
    return ret.trim();
  }
  return ret;
};

/**
 * Convert a string to a stream
 */
exports.toStream = function toStream(string) {
  const stream = new Readable();
  stream.push(string);
  stream.push(null);
  return stream;
};

// Find all rules
const rules = exports.rules = glob.sync(pathUtils.resolve(ruleDir, '!(rule.js)', '**', 'rule.js'))
  .map(file => pathUtils.dirname(pathUtils.relative(ruleDir, file)));

/**
 * Returns the rule index file
 */
exports.generateRuleIndex = function generateRuleIndex() {
  return retab(`
    module.exports = new Map([${rules.map(path => `
      [${JSON.stringify(path.replace(/\//g, '-'))}, require(${JSON.stringify(`./${pathUtils.join('rules', path, 'rule.js')}`)})],`
      ).join('')}
    ]);`
  ).trim();
};

exports.generateVersion = function generateVersion() {
  return `module.exports = ${JSON.stringify(version)}`;
};
