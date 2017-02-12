const Rule = require('../../rule');
const { cssEscape, $$ } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return 'input[name]:not([type=hidden]),textarea[name],select[name]';
  }

  test(el) {
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return null;
      }
      group = Array.from(elements).filter(elm => elm.type !== 'hidden');
    } else {
      const namePart = `[name="${cssEscape(el.name)}"]`;
      group = $$(`input${namePart}:not([type=hidden]),textarea${namePart},select${namePart}`).filter(elm => !elm.form);
    }

    if (group.length === 1 || el.closest('fieldset')) {
      return null;
    }

    return 'Multiple inputs with the same name should be in a fieldset';
  }
};
