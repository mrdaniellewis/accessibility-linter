const Rule = require('../../rule');
const { $$, cssEscape } = require('../../../utils');

const rSpace = /[ \t\n\f\r]/;

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return '[id]';
  }

  test(el) {
    if (!el.id) {
      return 'id should not be empty';
    }
    if (rSpace.test(el.id)) {
      return 'id should not contain space characters';
    }
    if (!el.id || $$(`[id="${cssEscape(el.id)}"]`).length > 1) {
      return 'id is not unique';
    }
    return null;
  }
};
