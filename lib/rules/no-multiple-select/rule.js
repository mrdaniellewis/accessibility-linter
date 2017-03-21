const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select[multiple]:not(:disabled)';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    return 'do not use multiple selects';
  }
};
