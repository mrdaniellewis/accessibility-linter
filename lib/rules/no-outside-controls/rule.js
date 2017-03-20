const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'input,textarea,select,button:not([type]),button[type="submit"],button[type="reset"]';
  }

  test(el, utils) {
    if (el.form || utils.hidden(el) || el.disabled) {
      return null;
    }
    return 'all controls should be associated with a form';
  }
};
