const { cssEscape } = require('./utils');

const addToSetArray = (set, key, value) => set.set(key, (set.get(key) || []).concat(value));
const isInSetArray = (set, key, value) => (set.get(key) || []).includes(value);

module.exports = class Runner {
  constructor(config) {
    const globalSettings = {};
    if (config.defaultOff) {
      globalSettings.enabled = false;
    }

    this.cacheReported = config.cacheReported !== false;
    this.ruleSettings = config.ruleSettings || {};

    this.rules = new Map(Array.from(config.rules)
      .map(([name, Rule]) => [
        name,
        new Rule(Object.assign({}, globalSettings, this.ruleSettings[name])),
      ])
    );

    this.ignoreAttribute = config.ignoreAttribute || 'data-accessibility-linter-ignore';

    this.whitelist = config.whitelist;
    this.logger = config.logger;

    this.reported = new WeakMap();
    this.whitelisted = new WeakMap();
    this.ignored = new WeakMap();
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context var p = new Proxy(target, handler);to run the rules within
   */
  run(context) {
    this.rules.forEach((rule, name) => this.runRule(rule, name, context));
  }

  filter(el, name) {
    return this.notWhitelisted(el, name)
      && this.notIgnored(el, name)
      && this.notReported(el, name);
  }

  /**
   * Run a single rule
   * @param {Object} rule The rule to run
   * @param {HTMLElement} [context] A context to run the rules within
   */
  runRule(rule, name, context) {
    if (!rule.enabled) {
      return;
    }
    rule.run(context, el => this.filter(el, name))
      .forEach((issue) => {
        if (this.cacheReported) {
          addToSetArray(this.reported, issue.el, name);
        }
        this.logger.log(issue);
      });
  }

  notReported(el, name) {
    return !isInSetArray(this.reported, el, name);
  }

  /**
   * Filter elements on the whitelist
   */
  notWhitelisted(el, name) {
    if (isInSetArray(this.whitelisted, el, name)) {
      return false;
    }
    const globalWhitelist = this.whitelist;
    const whitelist = this.ruleSettings[name] && this.ruleSettings[name].whitelist;
    const isWhitelisted = (globalWhitelist && el.matches(globalWhitelist)) ||
      (whitelist && el.matches(whitelist));

    if (isWhitelisted) {
      if (this.cacheReported) {
        addToSetArray(this.whitelisted, el, name);
      }
      return false;
    }
    return true;
  }

  notIgnored(el, ruleName) {
    if (isInSetArray(this.ignored, el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[${this.ignoreAttribute}=""],[${this.ignoreAttribute}~="${cssEscape(ruleName)}"]`
    );

    if (ignore) {
      if (this.cacheReported) {
        addToSetArray(this.ignored, el, ruleName);
      }
      return false;
    }

    return true;
  }
};
