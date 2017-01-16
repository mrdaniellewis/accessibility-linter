it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('unknown element');
});

it('does not add an error for known elements', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for an unknown element', when(() => {
  el = appendToBody('<frank />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));
