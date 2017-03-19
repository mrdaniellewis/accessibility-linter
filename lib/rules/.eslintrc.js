// Until https://github.com/eslint/eslint/issues/3611 is resolved
// the entire directory will allow mocha
module.exports = {
  env: {
    mocha: true,
  },
  globals: {
    // Globals for specs
    Rule: false,
    appendToBody: false,
    buildHtml: false,
    expect: false,
    linter: false,
    logger: false,
    proxy: false,
    uniqueId: false,
    whenDomUpdates: false,
  },
  rules: {
    'no-unused-expressions': 0,
    'class-methods-use-this': 0,
  },
};
