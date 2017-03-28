const Rule = require('../../rule');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector || (this._selector = Array.from(Object.entries(utils.config.elements))
      .filter(([, { unsupported }]) => unsupported)
      .map(([name]) => `${name}:not([role])`)
      .join(','));
  }

  test(el, utils) {
    const allowed = utils.aria.allowed(el);
    if (!allowed.implicit.length) {
      return null;
    }

    return 'element should have a role for backwards compatibility';
  }
};
