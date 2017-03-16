const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'a[href]';
  }

  test(el, utils) {
    if (utils.hidden(el) || utils.accessibleName(el)) {
      return null;
    }
    return 'links with a href must have a label';
  }
};
