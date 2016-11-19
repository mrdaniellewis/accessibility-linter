it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('Selects should have options');
});

it('adds an error if a select has no options', when(() => {
  el = appendToBody('<select />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not add an error if a select has options', when(() => {
  appendToBody('<select><option></select>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
