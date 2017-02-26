const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select[multiple]';
  }

  test() {
    return 'do not use multiple selects';
  }
};
