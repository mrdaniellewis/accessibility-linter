const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'input[list]';
  }

  test(el, utils) {
    const listId = el.getAttribute('list');
    if (listId && utils.$(`datalist[id="${utils.cssEscape(listId)}"]`)) {
      return null;
    }
    return 'no datalist found';
  }
};
