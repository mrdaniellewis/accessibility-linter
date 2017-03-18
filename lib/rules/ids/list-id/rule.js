const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'input[list]';
  }

  test(el, utils) {
    const listId = el.getAttribute('list');

    if (!listId) {
      return 'list attribute should not be empty';
    }

    if (rSpace.test(listId)) {
      return 'list attribute should not contain spaces';
    }

    if (listId && utils.$(`datalist[id="${utils.cssEscape(listId)}"]`)) {
      return null;
    }
    return 'no datalist found';
  }
};
