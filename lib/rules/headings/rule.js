const Rule = require('../rule');

const allowed = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function previous(el) {
  let cursor = el.previousElementSibling;
  while (cursor && cursor.lastElementChild) {
    cursor = cursor.lastElementChild;
  }
  return cursor;
}

module.exports = class extends Rule {
  selector() {
    return 'h2,h3,h4,h5,h6';
  }

  test(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(allowed.join())) {
        if (cursor.matches(allowed.slice(level - 2).join(','))) {
          return null;
        }
        break;
      }
    } while (cursor);
    return 'Headings must be nested correctly';
  }
};
