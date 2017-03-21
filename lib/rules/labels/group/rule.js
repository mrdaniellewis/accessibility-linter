const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'fieldset,details,[role~=group],[role~=radiogroup]';
  }

  test(el, utils) {
    if (utils.hidden(el)
      || (el.nodeName.toLowerCase() !== 'fieldset' && !utils.aria.hasRole(el, ['group', 'radiogroup']))
      || utils.accessibleName(el)) {
      return null;
    }
    const name = el.matches('fieldset,details') ? el.nodeName.toLowerCase() : utils.aria.getRole(el);
    return `${name} must have a label`;
  }
};
