const Rule = require('../rule');
const { $$ } = require('../../utils');

module.exports = class extends Rule {
  selector() {
    return 'select';
  }

  test(el) {
    if ($$('option', el).length) {
      return null;
    }
    return 'selects should have options';
  }
};
