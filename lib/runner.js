const { $$ } = require('./utils');

const dataAttr = 'allylint';

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);
const cssEscape = value => value.replace(/"/g, '\\"');

module.exports = class Runner {
  constructor(config) {
    this.tests = config.tests;
    this.whitelist = config.whitelist || {};
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakMap();
    // Elements with ignore attributes
    this.ignored = new WeakMap();
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
    $$(test.selector, context)
      .filter(el => this.filterIgnoreAttribute(el, test.name))
      .filter(el => this.filterWhitelist(el, test.name))
      .filter(el => !isInSetArray(this.reported, el, test.name))
      .filter(el => (test.filter ? !test.filter(el) : true))
      .forEach(el => {
        this.logger.error(test, el);
        addToSetArray(this.reported, el, test.name);
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el, testName) {
    const whitelist = this.whitelist;

    if (isInSetArray(this.whitelisted, el, testName)) {
      return false;
    }

    const isWhitelisted = Object.keys(whitelist).some(selector => {
      const testList = whitelist[selector];
      if (testList && !testList.includes(testName)) {
        return false;
      }
      return el.matches(selector);
    });

    if (isWhitelisted) {
      addToSetArray(this.whitelisted, el, testName);
      return false;
    }
    return true;
  }

  filterIgnoreAttribute(el, testName) {
    if (isInSetArray(this.ignored, el, testName)) {
      return false;
    }

    const ignore = el.matches(
      `[data-${dataAttr}-ignore=""],[data-${dataAttr}-ignore~="${cssEscape(testName)}"]`
    );

    if (ignore) {
      addToSetArray(this.ignored, el, testName);
      return false;
    }

    return true;
  }
};
