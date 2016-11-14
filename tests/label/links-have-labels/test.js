({
  message: 'links must have a label',
  selector: 'a',
  filter(el) {
    let text;
    if (el.hasAttribute('aria-labelledby')) {
      text = el.getAttribute('aria-labelledby')
        .split(/\s+/)
        .map(id => document.getElementById(id))
        .map(node => (node ? node.innerText : ''))
        .join(' ');
    } else if (el.hasAttribute('aria-label')) {
      text = el.getAttribute('aria-label');
    } else {
      text = el.innerText;
    }

    return text.trim();
  },
});
