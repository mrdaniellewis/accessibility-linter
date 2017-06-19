/**
 * Utils to help with building things
 */

const pathUtils = require('path');
const Readable = require('stream').Readable;

const browserify = require('browserify');
const glob = require('glob');

const ruleDir = pathUtils.resolve(__dirname, '..', 'rules');

const version = require('../../package.json').version;

/**
 * Convert a string to a stream
 */
function toStream(string) {
  const stream = new Readable();
  stream.push(string);
  stream.push(null);
  return stream;
}

// Find all rules
const rules = glob.sync(pathUtils.resolve(ruleDir, '!(rule.js)', '**', 'rule.js'))
  .map(file => pathUtils.dirname(pathUtils.relative(ruleDir, file)));

/**
 * Returns the rule index file
 */
function generateRuleList() {
  return `module.exports = ${JSON.stringify(rules)};`;
}

function generateVersion() {
  return `module.exports = ${JSON.stringify(version)}`;
}

exports.version = version;
exports.rules = rules;

exports.generateBuild = function generateBuild(config = {}) {
  const b = browserify(Object.assign({
    standalone: 'AccessibilityLinter',
    transform: ['strictify'],
    debug: true,
  }, config));

  rules.forEach((path) => {
    b.add(pathUtils.resolve(__dirname, '..', 'rules', path, 'rule.js'), { expose: `./rules/${path}/rule.js` });
  });

  b.exclude('./rules');
  b.add(toStream(generateRuleList()), {
    basedir: pathUtils.resolve(__dirname, '..'),
    expose: './rules' }
  );

  b.exclude('./version');
  b.add(toStream(generateVersion()), {
    basedir: pathUtils.resolve(__dirname, '..'),
    expose: './version' }
  );

  b.add(pathUtils.resolve(__dirname, '..', 'linter.js'));

  return b;
};
