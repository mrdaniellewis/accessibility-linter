const Rule = require('../../rule');

module.exports = class extends Rule {
  selector({ config }) {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};
