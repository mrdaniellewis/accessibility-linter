const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[role~=button],a[href="#"],a[href="#!"],a[href^="javascript:"]';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    return 'use a button instead of a link';
  }
};
