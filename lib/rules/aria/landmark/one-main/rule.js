const Rule = require('../../../rule');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'main,[role=main]';
  }

  test(el, utils) {
    const found = utils.$$('main,[role=main]');
    if (found.length > 1) {
      return 'there should only be one element with a role of main';
    }
    return null;
  }
};
