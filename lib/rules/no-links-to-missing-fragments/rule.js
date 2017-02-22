const Rule = require('../rule');

function removeHash(ob) {
  return ob.href.replace(/#.*$/, '');
}

module.exports = class extends Rule {
  selector() {
    return 'a[href*="#"]';
  }

  test(el, utils) {
    if (removeHash(window.location) !== removeHash(el)) {
      return null;
    }
    const id = utils.cssEscape(decodeURI(el.hash.slice(1)));
    if (utils.$(`[id="${id}"],a[name="${id}"]`)) {
      return null;
    }

    return 'fragment not found in document';
  }
};
