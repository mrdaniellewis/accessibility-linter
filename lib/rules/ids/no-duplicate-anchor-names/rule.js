const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[name]';
  }

  test(el, utils) {
    if (!el.name) {
      return 'name should not be empty';
    }
    if (el.id && el.id !== el.name) {
      return 'if the id attribute is present it must equal the name attribute';
    }
    const id = utils.cssEscape(el.name);
    if (id && utils.$$(`a[name="${id}"],[id="${id}"]`).length > 1) {
      return 'name is not unique';
    }
    return null;
  }
};
