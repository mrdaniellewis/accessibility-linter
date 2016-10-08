defineTest({
  message: 'Headings must be nested correctly',
  selector: 'h2,h3,h4,h5,h6',
  allowed: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  filter(el) {
    let cursor = el;
    const level = +el.nodeName[1];
    do {
      cursor = cursor.previousElementSibling || cursor.parentElement;
      if (cursor && cursor.matches(this.allowed.join())) {
        return !cursor.matches(this.allowed.slice(level - 1));
      }
    } while (cursor);
    return false;
  },
});
