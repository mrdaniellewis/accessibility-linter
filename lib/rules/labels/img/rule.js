const Rule = require('../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'img:not([alt])';
  }

  test() {
    return 'missing alt attribute';
  }
};
