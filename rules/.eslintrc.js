// Until https://github.com/eslint/eslint/issues/3611 is resolved
// the entire directory will allow mocha
module.exports = {
  env: {
    mocha: true
  },
  globals: {
    expect: false,
    defineTest: true,
    $: false,
    $$: false,
    cssEscape: false,
    standards: false,
    elements: false,
    aria: false,
    utils: false,
    // Globals for specs
    appendToBody: false,
    when: false,
    logger: false,
    el: true,
    el2: true,
    uniqueId: false,
    linter: false,
    rule: false,
  },
  rules: {
    'no-unused-expressions': 0,
  }
};
