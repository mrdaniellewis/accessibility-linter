defineTest({
  message: 'All fieldsets must have a legend',
  selector: 'fieldset',
  filter: el => {
    const first = el.firstElementChild;
    return first && first.matches('legend') && first.textContent.trim();
  },
});
