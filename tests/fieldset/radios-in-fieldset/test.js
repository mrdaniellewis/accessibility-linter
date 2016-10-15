defineTest({
  message: 'All radio inputs must be within a fieldset',
  selector: 'input[type=radio]',
  filter: el => el.closest('fieldset'),
});
