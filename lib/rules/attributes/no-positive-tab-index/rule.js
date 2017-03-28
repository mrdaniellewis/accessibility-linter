const Rule = require('../../rule.js');

module.exports = class extends Rule {
  selector() {
    return '[tabindex]';
  }

  test(el, utils) {
    if (el.tabIndex <= 0 || utils.hidden(el)) {
      return null;
    }

    return 'no tabindex greater than 0';
  }
};

