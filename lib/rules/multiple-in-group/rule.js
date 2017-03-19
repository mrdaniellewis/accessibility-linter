const Rule = require('../rule');

const excludeTypes = ['hidden', 'image', 'submit', 'reset', 'button'];
const excludeSelector = excludeTypes.map(type => `:not([type=${type}])`).join('');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = `input[name]${excludeSelector},textarea[name],select[name],object[name]`);
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return null;
      }
      group = Array.from(elements)
        .filter(elm => !excludeTypes.includes(elm.type))
        .filter(elm => !utils.hidden(elm));
    } else {
      const namePart = `[name="${utils.cssEscape(el.name)}"]`;
      group = utils.$$(`input${namePart}${excludeSelector},textarea${namePart},select${namePart},object${namePart}`)
        .filter(elm => !elm.form)
        .filter(elm => !utils.hidden(elm));
    }

    if (group.length === 1 || el.closest('fieldset') || utils.aria.closestRole(el, ['group', 'radiogroup'])) {
      return null;
    }

    return 'multiple inputs with the same name should be in a fieldset, group or radiogroup';
  }
};
