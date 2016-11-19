({
  message: 'Fragment not found in document',
  selector: 'a[href*="#"]',
  removeHash(ob) {
    return ob.href.replace(/#.*$/, '');
  },
  filter(el) {
    if (this.removeHash(location) !== this.removeHash(el)) {
      return true;
    }
    const id = cssEscape(decodeURI(el.hash.slice(1)));
    return $(`[id="${id}"],a[name="${id}"]`);
  },
});
