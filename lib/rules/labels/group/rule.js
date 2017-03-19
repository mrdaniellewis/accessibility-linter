const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'fieldset,[role~=group],[role~=radiogroup]';
  }

  test(el, utils) {
    if (utils.hidden(el)
      || (el.nodeName.toLowerCase() !== 'fieldset' && !utils.aria.hasRole(el, ['group', 'radiogroup']))
      || utils.accessibleName(el)) {
      return null;
    }
    return 'fieldsets, groups and radiogroups must have a label';
  }
};
