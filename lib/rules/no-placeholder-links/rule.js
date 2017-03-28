const Rule = require('../rule.js');

module.exports = class extends Rule {
  selector() {
    return 'a:not([href]),area:not([href])';
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'a' && utils.hidden(el)) {
      return null;
    }

    return 'links should have a href attribute';
  }
};

