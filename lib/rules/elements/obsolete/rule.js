const Rule = require('../../rule');
const config = require('../../../config');

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = Object.keys(config.elements).filter(el => config.elements[el].obsolete).join(','));
  }

  test() {
    return 'do not use obsolete elements';
  }
};
