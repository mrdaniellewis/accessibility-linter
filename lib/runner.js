const { $$, hidden } = require('./utils');

const dataAttr = 'accessibility-linter';

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);
const cssEscape = value => value.replace(/"/g, '\\"');

module.exports = class Runner {
  constructor(config) {
    this.rules = config.rules;
    this.ruleSettings = config.ruleSettings || {};
    this.defaultOff = !!config.defaultOff;

    this.whitelist = config.whitelist;
    this.logger = config.logger;

    // Elements and issues already reported
    this.reported = new WeakMap();
    // Elements that are whitelisted
    this.whitelisted = new WeakMap();
    // Elements with ignore attributes
    this.ignored = new WeakMap();
  }

  settings(name) {
    return this.ruleSettings[name] || {};
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.rules
      .forEach((rule, name) => {
        const enabled = this.settings(name).enabled;
        if (enabled === false ||
          (enabled !== true && (this.defaultOff || rule.enabled === false))) {
          return;
        }
        this.runRule(rule, name, context);
      });
  }

  /**
   * Run a single rule
   * @param {Object} rule The rule to run
   * @param {HTMLElement} [context] A context to run the rules within
   */
  runRule(rule, name, context) {
    $$(rule.selector, context)
      .filter(el => this.filterIgnoreAttribute(el, name))
      .filter(el => this.filterWhitelist(el, name))
      .filter(el => !isInSetArray(this.reported, el, name))
      .filter(el => (rule.includeHidden ? true : !hidden(el)))
      .filter(el => (rule.filter ? !rule.filter(el) : true))
      .forEach((el) => {
        const type = this.settings(name).type || rule.type || 'error';
        this.logger[type](rule, el);
        addToSetArray(this.reported, el, name);
      });
  }

  /**
   * Filter elements on the whitelist
   */
  filterWhitelist(el, name) {
    if (isInSetArray(this.whitelisted, el, name)) {
      return false;
    }

    const globalWhitelist = this.whitelist;
    const whitelist = this.settings(name).whitelist;
    const isWhitelisted = (globalWhitelist && el.matches(globalWhitelist)) ||
      (whitelist || el.matches(whitelist));

    if (isWhitelisted) {
      addToSetArray(this.whitelisted, el, name);
      return false;
    }

    return true;
  }

  filterIgnoreAttribute(el, ruleName) {
    if (isInSetArray(this.ignored, el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[data-${dataAttr}-ignore=""],[data-${dataAttr}-ignore~="${cssEscape(ruleName)}"]`
    );

    if (ignore) {
      addToSetArray(this.ignored, el, ruleName);
      return false;
    }

    return true;
  }
};
