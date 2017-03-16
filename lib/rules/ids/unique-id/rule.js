const Rule = require('../../rule');

const rSpace = /[ \t\n\f\r]/;

module.exports = class extends Rule {
  selector() {
    return '[id]';
  }

  test(el, utils) {
    if (!el.id) {
      return 'id should not be empty';
    }
    if (rSpace.test(el.id)) {
      return 'id should not contain space characters';
    }
    if (!el.id || utils.$$(`[id="${utils.cssEscape(el.id)}"]`).length > 1) {
      return 'id is not unique';
    }
    return null;
  }
};
