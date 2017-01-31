it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('all labels must be linked to a control');
});

it('adds an error for labels without a for attribute', when(() => {
  el = appendToBody('<label>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error for labels without an associated control', when(() => {
  el = appendToBody(`<label for="${uniqueId()}">`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not add an error for labels with an associated control', when(() => {
  const id = uniqueId();
  el = appendToBody(`<label for="${id}"><input id="${id}">`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
