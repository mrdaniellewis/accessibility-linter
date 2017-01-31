({
  message: 'id is not unique',
  selector: '[id]',
  filter: el => !el.id || $$(`[id="${cssEscape(el.id)}"]`).length === 1,
  includeHidden: true,
});
