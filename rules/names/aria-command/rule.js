({
  message: 'element must have a label',
  selector: '[role="button"],[role="link"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
  filter: el => !!utils.accessibleName(el),
});
