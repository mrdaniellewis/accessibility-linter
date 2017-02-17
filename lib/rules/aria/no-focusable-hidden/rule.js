const Rule = require('../../rule');

const focusable = ['button', 'input:not([type="hidden"])', 'meter', 'output', 'progress', 'select', 'textarea', 'a[href]', 'area[href]', '[tabindex]'];

module.exports = class extends Rule {
  setDefaults() {
    this.includeHidden = true;
  }

  selector() {
    return this._selector || (this._selector = focusable.map(selector => `${selector}[aria-hidden="true"]`).join(','));
  }

  test(el, utils) {
    if (el.nodeName.toLowerCase() === 'area' || !utils.hidden(el, { noAria: true })) {
      return 'do not mark focusable elements with `aria-hidden="true"`';
    }
    return null;
  }
};
