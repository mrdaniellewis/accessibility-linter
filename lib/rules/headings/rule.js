const Rule = require('../rule');

const selector = 'h2,h3,h4,h5,h6,[role~=heading]';

function previous(el) {
  let cursor = el.previousElementSibling;
  while (cursor && cursor.lastElementChild) {
    cursor = cursor.lastElementChild;
  }
  return cursor;
}

function getLevel(el) {
  return /h[1-6]/i.test(el.nodeName) ? +el.nodeName[1] : (+el.getAttribute('aria-level') || 2);
}

module.exports = class extends Rule {
  selector() {
    return `${selector}:not([aria-level="1"])`;
  }

  test(el, utils) {
    if (!utils.aria.hasRole(el, 'heading') || utils.hidden(el)) {
      return null;
    }
    let cursor = el;
    const level = getLevel(el);
    do {
      cursor = previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(`h1,${selector}`) && !utils.hidden(cursor) && utils.aria.hasRole(cursor, 'heading')) {
        const previousLevel = getLevel(cursor);
        if (level <= previousLevel + 1) {
          return null;
        }
        break;
      }
    } while (cursor && cursor !== document.body);
    return 'headings must be nested correctly';
  }
};
