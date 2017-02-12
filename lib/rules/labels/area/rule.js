const Rule = require('../../rule');
const { $, cssEscape, hidden } = require('../../../utils');

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return 'area[href]';
  }

  test(el) {
    const map = el.closest('map');
    if (!map || !map.name) {
      return null;
    }
    const img = $(`img[usemap="#${cssEscape(map.name)}"]`);
    if (!img || hidden(img)) {
      return null;
    }
    if (el.alt) {
      return null;
    }
    return 'area with a href must have a label';
  }
};
