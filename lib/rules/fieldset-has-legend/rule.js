const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'fieldset';
  }

  test(el) {
    const first = el.firstElementChild;
    if (first && first.matches('legend')) {
      return null;
    }
    return 'fieldsets must have a legend';
  }
};
