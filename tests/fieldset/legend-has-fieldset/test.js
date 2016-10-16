({
  message: 'All legends must be the first child of a fieldset',
  selector: 'legend',
  // Detecting text nodes isn't worth it
  filter: el => el.parentNode.matches('fieldset') && el === el.parentNode.firstElementChild,
});

