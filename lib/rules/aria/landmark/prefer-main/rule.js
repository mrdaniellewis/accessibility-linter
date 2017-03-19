const Rule = require('../../../rule');

module.exports = class extends Rule {
  selector() {
    return ':not(main)[role~=main]';
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'main')) {
      return null;
    }

    return 'use a main element for role=main';
  }
};
