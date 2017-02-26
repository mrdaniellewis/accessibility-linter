const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'html';
  }

  test() {
    if (document.title.trim()) {
      return null;
    }
    return 'document must have a title';
  }
};
