({
  message: 'focusable elements must have a label',
  selector: '[tabindex]',
  filter: el => !!utils.accessibleName(el),
});
