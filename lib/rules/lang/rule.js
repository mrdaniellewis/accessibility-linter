const Rule = require('../rule');

// Language tags are defined in http://www.ietf.org/rfc/bcp/bcp47.txt
const match = /^((en-gb-oed)|([a-z]{2,3}(-[a-z]{3})?(-[a-z]{4})?(-[a-z]{2}|-\d{3})?(-[a-z0-9]{5,8}|-(\d[a-z0-9]{3}))*))$/i;

module.exports = class extends Rule {
  selector() {
    return 'html';
  }

  test(el) {
    if (!el.lang) {
      return 'missing lang attribute';
    }
    if (!match.test(el.lang)) {
      return 'language code is invalid';
    }
    return null;
  }
};
