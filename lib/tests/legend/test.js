defineTest({
  message: 'All legends must be the first child of a fieldset',
  selector: 'legend',
  filter: el => el === el.parentNode.firstElementChild,
});
