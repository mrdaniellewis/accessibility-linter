const Rule = require('../../rule');

const focusable = 'button,input:not([type="hidden"]),meter,output,progress,select,textarea,a[href],area[href],[tabindex]';

module.exports = class extends Rule {
  selector() {
    return '[role~=none],[role~=presentation]';
  }

  test(el, utils) {
    if (el.matches(focusable) && utils.aria.hasRole(el, ['none', 'presentation'])) {
      return 'do not mark focusable elements with a role of presentation or none';
    }
    return null;
  }
};
