const Rule = require('../../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return ':not(main)[role=main]';
  }

  test() {
    return 'use a main element for role=main';
  }
};
