defineTest({
  message: 'Headings must be nested correctly',
  selector: 'h2,h3,h4,h5,h6',
  allowed: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  previous(el) {
    let cursor = el.previousElementSibling;
    while (cursor && cursor.lastElementChild) {
      cursor = cursor.lastElementChild;
    }
    return cursor || el.parentElement;
  },
  filter(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = this.previous(cursor) || cursor.parentElement;
      if (cursor && cursor.matches(this.allowed.join())) {
        return cursor.matches(this.allowed.slice(level - 2).join(','));
      }
    } while (cursor);
    return false;
  },
});
