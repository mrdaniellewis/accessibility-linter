const message = 'selects should have options';

it('adds an error if a select has no options', () => {
  const el = appendToBody('<select />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error if a select has options', () => {
  appendToBody('<select><option></select>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if select is hidden', () => {
  appendToBody('<select style="display: none"></select>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if select is disabled', () => {
  appendToBody('<select disabled></select>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
