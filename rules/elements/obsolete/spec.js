it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('do not use obsolete elements');
});

it('does not add an error for non-obsolete elements', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for an obsolete element', when(() => {
  el = appendToBody('<isindex />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));
