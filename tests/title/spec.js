it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('document must have a title');
});

it('it adds an error if the document has an empty title', () => {
  linter.run(document);
  expect(logger).toHaveEntries([test, $('html')[0]]);
});

it('it does not add an error if the document has a title', when(() => {
  document.title = 'title';
}).then(() => {
  expect(logger).toNotHaveEntries();
}));