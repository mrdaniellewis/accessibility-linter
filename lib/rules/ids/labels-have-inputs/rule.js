const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return 'label[for]';
  }

  test(el) {
    if (!el.htmlFor) {
      return 'for attribute should not be empty';
    }

    if (rSpace.test(el.htmlFor)) {
      return 'for attribute should not contain spaces';
    }

    if (document.getElementById(el.htmlFor)) {
      return null;
    }

    return 'no element can be found with id of id attribute';
  }
};
