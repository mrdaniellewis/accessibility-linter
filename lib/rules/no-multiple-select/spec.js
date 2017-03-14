const message = 'do not use multiple selects';

it('adds an error if a multiple select is used', () => {
  const el = appendToBody('<select multiple />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error if an normal select is used', () => {
  appendToBody('<select />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
