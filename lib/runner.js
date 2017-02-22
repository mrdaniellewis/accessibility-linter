const Utils = require('./utils');

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
        new Rule(Object.assign({ name }, globalSettings, this.ruleSettings[name])),
      ])
    );

    this.ignoreAttribute = config.ignoreAttribute || 'data-accessibility-linter-ignore';

    this.whitelist = config.whitelist;
    this.logger = config.logger;

    this.reported = new WeakMap();
    this.whitelisted = new WeakMap();
    this.ignored = new WeakMap();

    this.utils = null;
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.utils = new Utils();
    this.rules.forEach((rule) => {
      if (rule.enabled) {
        this.runInternal(rule, context);
      }
    });
    this.utils = null;
  }

  /**
   * Run one rule regardless of it being enabled
   * @name {String|Rule} rule A rule or name of a rule
   * @param {HTMLElement} [context] A context
   */
  runRule(rule, context) {
    if (typeof rule === 'string') {
      rule = this.rules.get(name);
    }
    this.utils = new Utils();
    this.runInternal(rule, context);
    this.utils = null;
  }

  /**
   * Filter if the element has already reported on this rule or is excluded from this rule
   * @private
   */
  filter(el, name) {
    return this.notWhitelisted(el, name)
      && this.notIgnored(el, name)
      && this.notReported(el, name);
  }

  /**
   * Run a single rule
   * @private
   */
  runInternal(rule, context) {
    rule.run(context, el => this.filter(el, rule.name), this.utils)
      .forEach((issue) => {
        if (this.cacheReported) {
          addToSetArray(this.reported, issue.el, rule.name);
        }
        this.logger.log(issue);
      });
  }

  /**
   * Has this already been reported for this element
   * @private
   */
  notReported(el, name) {
    return !isInSetArray(this.reported, el, name);
  }

  /**
   * Is this element excluded by a whitelist
   * @private
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

  /**
   * Is this element excluded by an attribute
   * @private
   */
  notIgnored(el, ruleName) {
    if (isInSetArray(this.ignored, el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[${this.ignoreAttribute}=""],[${this.ignoreAttribute}~="${this.utils.cssEscape(ruleName)}"]`
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
