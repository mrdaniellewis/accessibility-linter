const Rule = require('../../rule');
const { accessibleName } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return 'a[href]';
  }

  test(el) {
    if (accessibleName(el)) {
      return null;
    }
    return 'links with a href must have a label';
  }
};
