const Rule = require('../../rule');

module.exports = class extends Rule {
  selector(utils) {
    return this._selector || (this._selector = utils.aria.rolesOfType('command').map(role => `[role~="${role}"]`).join(','));
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, utils.aria.rolesOfType('command'))) {
      return null;
    }
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'elements with a role with a superclass of command must have a label';
  }
};
