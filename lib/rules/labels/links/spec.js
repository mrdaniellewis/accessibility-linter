const message = 'links with a href must have a label';

it('does not add an error for links with a href and label', when(() => {
  appendToBody('<a href="#">foo</a>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for links without a href and label', when(() => {
  appendToBody('<a />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for links that are hidden', when(() => {
  appendToBody('<a href="#" aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for links without a label', when(() => {
  el = appendToBody('<a href="#" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
