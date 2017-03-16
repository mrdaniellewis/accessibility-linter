const Rule = require('../rule');

function removeHash(ob) {
  return ob.href.replace(/#.*$/, '');
}

module.exports = class extends Rule {
  selector() {
    return 'a[href*="#"]';
  }

  test(el, utils) {
    if (utils.hidden(el)) {
      return null;
    }
    if (removeHash(window.location) !== removeHash(el)) {
      return null;
    }
    const id = utils.cssEscape(decodeURI(el.hash.slice(1)));
    const found = utils.$(`[id="${id}"],a[name="${id}"]`);

    if (!found) {
      return 'fragment not found in document';
    }

    if (utils.hidden(found)) {
      return 'link target is hidden';
    }

    return null;
  }
};
