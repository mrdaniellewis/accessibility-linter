const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  deprecated() {
    return this._deprecated || (this._deprecated = Object.entries(config.ariaAttributes)
      .filter(([, value]) => value.deprecated)
      .map(([name]) => `aria-${name}`));
  }

  selector() {
    return this.deprecated().map(name => `[${name}]`).join(',');
  }

  test(el) {
    return Array.from(el.attributes)
      .filter(({ name }) => this.deprecated().includes(name))
      .map(({ name }) => `${name} is deprecated`);
  }
};
