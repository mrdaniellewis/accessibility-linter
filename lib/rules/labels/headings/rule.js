const Rule = require('../../rule');
const { accessibleName } = require('../../../utils');

module.exports = class extends Rule {
  selector() {
    return 'h1,h2,h3,h4,h5,h6,[role="heading"]';
  }

  test(el) {
    if (accessibleName(el)) {
      return null;
    }
    return 'headings must have a label';
  }
};
