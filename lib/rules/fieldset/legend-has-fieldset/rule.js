const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return ':not(fieldset)>legend,fieldset>legend:not(:first-child)';
  }

  test() {
    return 'All legends must be the first child of a fieldset';
  }
};
