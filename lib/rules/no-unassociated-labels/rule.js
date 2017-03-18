const Rule = require('../rule');

const labelable = 'input:not([type=hidden]),select,textarea,button,meter,output,progress';

module.exports = class extends Rule {
  selector() {
    return 'label';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }

    if (el.htmlFor) {
      const forEl = document.getElementById(el.htmlFor);
      if (!forEl) {
        return 'label is not labelling an element';
      }
      if (utils.hidden(forEl)) {
        return 'label is labelling a hidden element';
      }
      return null;
    }

    const targets = utils.$$(labelable, el);

    if (targets.length && !targets.filter(elm => !utils.hidden(elm)).length) {
      return 'label is labelling a hidden element';
    }

    if (!targets.length) {
      return 'label is not labelling an element';
    }

    return null;
  }
};
