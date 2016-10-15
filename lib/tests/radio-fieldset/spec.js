it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('All radio inputs must be within a fieldset');
});

it('adds an error if a radio is not in a fieldset', when(() => {
  el = appendToBody('<input type="radio">');
}).then(() => {
  expect(logger).toHaveEntries([test, el]);
}));

it('does not add an error if a radio is in a fieldset', when(() => {
  appendToBody('<fieldset><input type="radio"></fieldset>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
