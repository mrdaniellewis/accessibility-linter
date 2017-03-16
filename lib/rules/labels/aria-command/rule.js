const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[role="button"],[role="link"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';
  }

  test(el, utils) {
    if (utils.hidden(el) || utils.accessibleName(el)) {
      return null;
    }
    return 'elements with a role with a superclass of command must have a label';
  }
};
