const Rule = require('../../../rule');

module.exports = class extends Rule {
  selector() {
    return 'header,[role~=banner]';
  }

  get role() {
    return 'banner';
  }

  get message() {
    return `there should only be one element with a role of ${this.role} in each document or application`;
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, this.role)) {
      return null;
    }

    const found = utils.$$(this.selector())
      .filter(elm => utils.aria.hasRole(elm, this.role))
      .groupBy(elm => utils.aria.closestRole(elm, ['application', 'document']))
      .filter(group => group.includes(el))
      .flatten();

    if (found.length > 1) {
      return this.message;
    }

    return null;
  }
};
