const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'h1,h2,h3,h4,h5,h6,[role~="heading"]';
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'heading')) {
      return null;
    }
    if (utils.hidden(el, { ariaHidden: true }) || utils.accessibleName(el)) {
      return null;
    }
    return 'headings must have a label';
  }
};
