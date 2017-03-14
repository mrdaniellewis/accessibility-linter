const message = 'selects should have options';

it('adds an error if a select has no options', () => {
  const el = appendToBody('<select />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});

it('does not add an error if a select has options', () => {
  appendToBody('<select><option></select>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
