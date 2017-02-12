const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'label';
  }

  test(el) {
    if (el.htmlFor && document.getElementById(el.htmlFor)) {
      return null;
    }
    return 'all labels must be linked to a control';
  }
};
