({
  message: 'Name is not unique',
  selector: 'a[name]',
  filter(el) {
    const id = cssEscape(el.name);
    return id && $$(`a[name="${id}"],[id="${id}"]`).length === 1;
  },
  includeHidden: true,
});
