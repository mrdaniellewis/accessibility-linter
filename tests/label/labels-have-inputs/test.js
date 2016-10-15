defineTest({
  message: 'all labels must be linked to a control',
  selector: 'label',
  filter: el => el.htmlFor && document.getElementById(el.htmlFor),
});
