const message = 'document must have a title';

it('it adds an error if the document has an empty title', () => {
  linter.run(document);
  expect(logger).toHaveErrors([message, document.documentElement]);
});

it('it does not add an error if the document has a title', () => {
  document.title = 'title';
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
