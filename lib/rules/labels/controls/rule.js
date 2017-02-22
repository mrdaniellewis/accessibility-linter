const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'button,input:not([type="hidden"]),meter,output,progress,select,textarea';
  }

  test(el, utils) {
    if (utils.accessibleName(el)) {
      return null;
    }
    return 'form controls must have a label';
  }
};
