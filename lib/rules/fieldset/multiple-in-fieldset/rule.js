const Rule = require('../../rule');

const excludeTypes = ['hidden', 'image', 'submit', 'reset', 'button'];
const excludeSelector = excludeTypes.map(type => `:not([type=${type}])`).join('');

module.exports = class extends Rule {
  selector() {
    return `input[name]${excludeSelector},textarea[name],select[name]`;
  }

  test(el, utils) {
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return null;
      }
      group = Array.from(elements).filter(elm => excludeTypes.includes(elm.type));
    } else {
      const namePart = `[name="${utils.cssEscape(el.name)}"]`;
      group = utils.$$(`input${namePart}${excludeSelector},textarea${namePart},select${namePart}`).filter(elm => !elm.form);
    }

    if (group.length === 1 || el.closest('fieldset')) {
      return null;
    }

    return 'Multiple inputs with the same name should be in a fieldset';
  }
};
