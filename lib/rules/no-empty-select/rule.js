const Rule = require('../rule');

module.exports = class extends Rule {
  selector() {
    return 'select';
  }

  test(el, utils) {
    if (utils.hidden(el) || utils.$$('option', el).length) {
      return null;
    }
    return 'selects should have options';
  }
};
