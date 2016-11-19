it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('Do not use multiple selects');
});

it('adds an error if a multiple select is used', when(() => {
  el = appendToBody('<select multiple />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not add an error if an normal select is used', when(() => {
  appendToBody('<select />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
