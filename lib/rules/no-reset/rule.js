const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[type=reset],button[type=reset]';
  }

  test() {
    return 'do not use reset buttons';
  }
};
