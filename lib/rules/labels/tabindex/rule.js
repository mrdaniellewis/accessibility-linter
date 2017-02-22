const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'focusable elements must have a label';
  }
};
