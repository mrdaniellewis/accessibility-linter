const Rule = require('../../rule');

module.exports = class extends Rule {
  selector() {
    return 'area[href]';
  }

  test(el, utils) {
    const map = el.closest('map');
    if (!map || !map.name) {
      return null;
    }
    const img = utils.$(`img[usemap="#${utils.cssEscape(map.name)}"]`);
    if (!img || utils.hidden(img)) {
      return null;
    }
    if (el.alt) {
      return null;
    }
    return 'area with a href must have a label';
  }
};
