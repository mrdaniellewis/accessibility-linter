const Rule = require('../../rule');
const { $, cssEscape } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return 'input[list]';
  }

  test(el) {
    const listId = el.getAttribute('list');
    if (listId && $(`datalist[id="${cssEscape(listId)}"]`)) {
      return null;
    }
    return 'no datalist found';
  }
};
