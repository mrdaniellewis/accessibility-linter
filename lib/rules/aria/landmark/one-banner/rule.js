const Rule = require('../../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'header,[role=banner]';
  }

  test(el, utils) {
    const found = utils.$$('header,[role=banner]').filter(el => !el.closest('section, article'));
    if (found.length > 1) {
      return 'there should only be one element with a role of banner';
    }
    return null;
  }
};
