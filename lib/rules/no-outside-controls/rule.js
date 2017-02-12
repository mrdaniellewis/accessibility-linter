const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input,textarea,select,button:not([type]),button[type="submit"],button[type="reset"]';
  }

  test(el) {
    if (el.form) {
      return null;
    }
    return 'all controls should be associated with a form';
  }
};
