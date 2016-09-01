const select = require('./utils').select;

module.exports = class Runner {
  constructor(config) {
    this.tests = config.tests;
    this.whitelist = config.whitelist;
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakSet();
  }

  /**
   * Run all the tests
   * @param {HTMLElement} [context] A context to run the tests within
   */
  run(context) {
    this.tests
      .filter(test => !(test.globalOnly && context))
      .forEach(test => this.runTest(test, context));
  }

  /**
   * Run a single test
   * @param {Object} test The test to run
   * @param {HTMLElement} [context] A context to run the tests within
   */
  runTest(test, context) {
    select(test.selector, context)
      .filter(this.filterWhitelist, this)
      .filter(el => (this.reported.get(el) || []).includes(test.name))
      .filter(test.filter || Boolean)
      .forEach(el => {
        this.logger.error(test, el);
        this.reported.set(el, (this.reported.get(el) || []).concat(test.name));
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el) {
    if (this.whitelisted.has(el)) {
      return false;
    }
    if (this.whitelist.some(test => el.matches(test))) {
      this.whitelisted.add(el);
      return false;
    }
    return true;
  }
};
