({
  message: 'Selects should have options',
  selector: 'select',
  filter: el => $$('option', el).length,
});
