const Rule = require('../../rule');
const { accessibleName } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return 'button,input:not([type="hidden"]),meter,output,progress,select,textarea';
  }

  test(el) {
    if (accessibleName(el)) {
      return null;
    }
    return 'form controls must have a label';
  }
};
