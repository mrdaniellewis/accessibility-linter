const Rule = require('../../rule');

module.exports = class extends Rule {
  selector({ config }) {
    return this._selector || (this._selector = Object.keys(config.elements).map(name => `:not(${name})`).join(''));
  }

  test(el) {
    if (el.closest('svg,math')) {
      return null;
    }
    return 'unknown element';
  }
};
