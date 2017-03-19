const Rule = require('../../rule');
const { rSpace } = require('../../../support/constants');

module.exports = class extends Rule {
  selector() {
    return '[role]';
  }

  test(el) {
    const roles = el.getAttribute('role').split(rSpace).filter(Boolean);
    if (roles.join(' ') === 'none presentation') {
      return null;
    }

    if (roles.length > 1) {
      return 'do not add multiple roles';
    }

    return null;
  }
};
