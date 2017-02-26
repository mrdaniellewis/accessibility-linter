const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return '[data],[data-]';
  }

  test() {
    return 'data is an attribute prefix';
  }
};
