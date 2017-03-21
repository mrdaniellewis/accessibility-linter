/**
 *  Determine if an element is hidden or not
 */
/* eslint-disable class-methods-use-this */

const ElementCache = require('../support/element-cache');

// Elements that don't have client rectangles
const noRects = ['br', 'wbr'];

// Is the element hidden using CSS
function cssHidden(el, style) {
  return style.get(el, 'visibility') !== 'visible' || style.get(el, 'display') === 'none';
}

// Is the element hidden from accessibility software
function hidden(el, style, ariaHidden = false) {
  if (el === document) {
    return false;
  }
  return (ariaHidden && el.getAttribute('aria-hidden') === 'true')
    || (!noRects.includes(el.nodeName.toLowerCase()) && el.getClientRects().length === 0)
    || (ariaHidden && !!el.closest('[aria-hidden=true]'))
    || cssHidden(el, style);
}

/**
 *  Cache of hidden element
 */
module.exports = class Hidden extends ElementCache {
  constructor(style) {
    super();
    this.style = style;
  }

  key(el, { ariaHidden = false } = {}) {
    return ariaHidden;
  }

  setter(el, { ariaHidden = false } = {}) {
    return hidden(el, this.style, ariaHidden);
  }
};
