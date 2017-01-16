const Runner = require('./runner');
const Logger = require('./logger');
const rules = require('./rules');
const utils = require('./utils');
const version = require('./version');
const aria = require('./aria');
const elements = require('./elements');

const Linter = module.exports = class AccessibilityLinter extends Runner {
  constructor(options) {
    options = options || {};
    options.logger = options.logger || new Logger();
    options.rules = options.rules || rules;
    super(options);

    this.root = options.root || document;
  }

  /**
   * Start looking for issues
   */
  observe() {
    this.observer = utils.observe(this.run.bind(this), this.root);
  }

  /**
   * Stop looking for issues
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
};

Linter.Logger = Logger;
Linter.rules = rules;
Linter.version = version;
Linter.aria = aria;
Linter.elements = elements;
Linter.utils = utils;
