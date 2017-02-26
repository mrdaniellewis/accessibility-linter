// Until https://github.com/eslint/eslint/issues/3611 is resolved
// the entire directory will allow mocha
module.exports = {
  env: {
    mocha: true,
  },
  globals: {
    // Globals for specs
    expect: false,
    appendToBody: false,
    when: false,
    logger: false,
    el: true,
    el2: true,
    uniqueId: false,
    linter: false,
    proxy: false,
    $: false,
    Rule: false,
  },
  rules: {
    'no-unused-expressions': 0,
    'class-methods-use-this': 0,
  },
};
