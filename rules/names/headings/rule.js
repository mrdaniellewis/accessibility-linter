({
  message: 'headings must have a label',
  selector: 'h1,h2,h3,h4,h5,h6,[role="heading"]',
  filter: el => !!utils.accessibleName(el),
});
