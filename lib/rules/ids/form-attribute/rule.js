const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

const selector = ['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'].map(name => `${name}[form]`).join(',');

module.exports = class extends Rule {
  selector() {
    return selector;
  }

  test(el) {
    const formId = el.getAttribute('form');
    if (!formId) {
      return 'form attribute should be an id';
    }

    if (rSpace.test(formId)) {
      return 'form attribute should not contain spaces';
    }

    const form = document.getElementById(formId);
    if (!form) {
      return `cannot find element for form attribute with id "${formId}"`;
    }

    if (form.nodeName.toLowerCase() !== 'form') {
      return 'form attribute does not point to a form';
    }

    return null;
  }
};
