const Utils = require('./utils');
const SetCache = require('./support/set-cache');

const dummyCache = {
  add() {},
  set() {},
  has() { return false; },
};

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

    if (this.cacheReported) {
      this.reported = new SetCache();
      this.whitelisted = new SetCache();
      this.globalWhitelisted = new WeakSet();
      this.ignored = new SetCache();
    } else {
      this.reported = this.whitelisted = this.globalWhitelisted = this.ignored = dummyCache;
    }

    this.utils = null;
  }

  /**
   * Run all the rules
   * @param {HTMLElement} [context] A context to run the rules within
   */
  run(context) {
    this.utils = new Utils();
    Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .forEach(rule => this.runInternal(rule, context, (el, name) => this.filter(el, name)));
    this.utils = null;
  }

  /**
   * Run one rule regardless of it being enabled
   * @name {String|Rule} rule A rule or name of a rule
   * @param {HTMLElement} [context] A context
   * @param {String} [whitelist] Optionally a whitelist
   */
  runRule(rule, { context, whitelist, ruleSettings } = {}) {
    if (typeof rule === 'string') {
      rule = this.rules.get(rule);
    }

    const runner = new Runner({
      rules: new Map([[rule.name, rule.constructor]]),
      whitelist: whitelist || this.whitelist,
      logger: this.logger,
      ruleSettings: {
        [rule.name]: Object.assign(
          {},
          ruleSettings || this.ruleSettings[rule.name] || {},
          { enabled: true }
        ),
      },
    });

    runner.run(context);
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
  runInternal(rule, context, filter) {
    rule.run(context, el => filter(el, rule.name), this.utils)
      .forEach((issue) => {
        this.reported.set(issue.el, rule.name);
        this.logger.log(Object.assign({ name: rule.name }, issue));
      });
  }

  /**
   * Has this already been reported for this element
   * @private
   */
  notReported(el, name) {
    return !this.reported.has(el, name);
  }

  /**
   * Is this element excluded by a whitelist
   * @private
   */
  notWhitelisted(el, name) {
    if (this.globalWhitelisted.has(el) || this.whitelisted.has(el, name)) {
      return false;
    }

    if (this.whitelist && el.matches(this.whitelist)) {
      this.globalWhitelisted.add(el);
      return false;
    }

    const whitelist = this.ruleSettings[name] && this.ruleSettings[name].whitelist;
    if (whitelist && el.matches(whitelist)) {
      this.whitelisted.set(el, name);
      return false;
    }

    return true;
  }

  /**
   * Is this element excluded by an attribute
   * @private
   */
  notIgnored(el, ruleName) {
    if (this.ignored.has(el, ruleName)) {
      return false;
    }

    const ignore = el.matches(
      `[${this.ignoreAttribute}=""],[${this.ignoreAttribute}~="${this.utils.cssEscape(ruleName)}"]`
    );

    if (ignore) {
      this.ignored.set(el, ruleName);
      return false;
    }

    return true;
  }
};
