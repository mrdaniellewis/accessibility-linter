const Rule = require('../../rule');

module.exports = class extends Rule {
  deprecated(utils) {
    return this._deprecated || (this._deprecated = Object.entries(utils.config.ariaAttributes)
      .filter(([, value]) => value.deprecated)
      .map(([name]) => `aria-${name}`));
  }

  selector(utils) {
    return this.deprecated(utils).map(name => `[${name}]`).join(',');
  }

  test(el, utils) {
    return Array.from(el.attributes)
      .filter(({ name }) => this.deprecated(utils).includes(name))
      .map(({ name }) => `${name} is deprecated`);
  }
};
