const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'button:not([type])';
  }

  test() {
    return 'all buttons should have a type attribute';
  }
};
