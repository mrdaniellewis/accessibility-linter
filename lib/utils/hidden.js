// Is the element hidden using CSS
function cssHidden(el, style) {
  style = style || window.getComputedStyle(el);
  return style.visibility !== 'visible' || style.display === 'none';
}

// Is the element hidden from accessibility software
module.exports = function hidden(el, style) {
  return el.getAttribute('aria-hidden') === 'true'
    || el.getClientRects().length === 0
    || !!el.closest('[aria-hidden=true]')
    || cssHidden(el, style);
};
