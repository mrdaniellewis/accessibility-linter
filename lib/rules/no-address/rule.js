const Rule = require('../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'address';
  }

  test() {
    return 'do not use the address element';
  }
};
