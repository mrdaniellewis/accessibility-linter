const Runner = require('./runner');
const Logger = require('./logger');
const tests = require('./tests');
const utils = require('./utils');

module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.tests = options.tests || tests;
    super(options);

    this.root = options.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
    this.run(this.root);
    this.observer = utils.observe(this.run.bind(this), this.root);
  }

  /**
   * Stop looking for issues
   */
  stopObserving() {
    this.observer.disconnect();
    this.observer = null;
  }
};
