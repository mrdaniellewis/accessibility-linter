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
    // Globals for specs
    appendElement: false,
    when: false,
    logger: false,
    el: true,
    uniqueId: false,
  },
};
