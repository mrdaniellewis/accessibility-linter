it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('Do not use reset buttons');
});

it('adds an error if a reset input is used', when(() => {
  el = appendToBody('<input type="reset">');
}).then(() => {
  expect(logger).toHaveEntries([test, el]);
}));

it('does not add an error if an input is used', when(() => {
  appendToBody('<input>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a reset button is used', when(() => {
  el = appendToBody('<button type="reset" />');
}).then(() => {
  expect(logger).toHaveEntries([test, el]);
}));

it('does not add an error if a button is used', when(() => {
  appendToBody('<button />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
