const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).map(name => `:not(${name})`).join(''));
  }

  test(el) {
    if (el.closest('svg,math')) {
      return null;
    }
    return 'unknown element';
  }
};
