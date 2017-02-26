/**
 *  Determine if an element is hidden or not
 */
/* eslint-disable class-methods-use-this */

const Cache = require('./cache');

// Is the element hidden using CSS
function cssHidden(el, style) {
  return style.get(el, 'visibility') !== 'visible' || style.get(el, 'display') === 'none';
}

// Is the element hidden from accessibility software
function hidden(el, style, noAria = false) {
  if (el === document) {
    return false;
  }
  return (!noAria && el.getAttribute('aria-hidden') === 'true')
    || el.getClientRects().length === 0
    || (!noAria && !!el.closest('[aria-hidden=true]'))
    || cssHidden(el, style);
}

/**
 *  Cache of hidden element
 */
module.exports = class HiddenCache extends Cache {
  constructor(style) {
    super();
    this.style = style;
  }

  key(el, { noAria = false } = {}) {
    return noAria;
  }

  setter(el, { noAria = false } = {}) {
    return hidden(el, this.style, noAria);
  }
};
