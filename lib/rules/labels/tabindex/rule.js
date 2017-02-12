const Rule = require('../../rule');
const { accessibleName } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el) {
    if (accessibleName(el)) {
      return null;
    }
    return 'focusable elements must have a label';
  }
};
