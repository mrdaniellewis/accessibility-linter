const Rule = require('../rule');
const { $, cssEscape } = require('../../utils');

function removeHash(ob) {
  return ob.href.replace(/#.*$/, '');
}

module.exports = class extends Rule {
  selector() {
    return 'a[href*="#"]';
  }

  test(el) {
    if (removeHash(window.location) !== removeHash(el)) {
      return null;
    }
    const id = cssEscape(decodeURI(el.hash.slice(1)));
    if ($(`[id="${id}"],a[name="${id}"]`)) {
      return null;
    }

    return 'fragment not found in document';
  }
};
