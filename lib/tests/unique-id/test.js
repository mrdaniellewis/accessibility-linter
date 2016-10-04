defineTest({
  message: 'id is not unique',
  selector: '[id]',
  filter: el => !el.id || $$(`#${el.id}`).length === 1,
});
