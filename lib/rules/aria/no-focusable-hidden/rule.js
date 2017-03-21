const Rule = require('../../rule');

const focusable = ['button:not(:disabled)', 'input:not([type="hidden"]):not(:disabled)', 'select:not(:disabled)', 'textarea:not(:disabled)', 'a[href]', 'area[href]', '[tabindex]'];

module.exports = class extends Rule {
  selector() {
    return this._selector || (this._selector = focusable.map(selector => `${selector}[aria-hidden="true"]`).join(','));
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'area' || !utils.hidden(el)) {
      return 'do not mark focusable elements with `aria-hidden="true"`';
    }
    return null;
  }
};
