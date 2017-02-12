const Rule = require('../../rule');
const { accessibleName } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return '[role="button"],[role="link"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';
  }

  test(el) {
    if (accessibleName(el)) {
      return null;
    }
    return 'elements with a role with a superclass of command must have a label';
  }
};
