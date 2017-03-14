const message = 'do not use reset buttons';

it('adds an error if a reset input is used', () => {
  const el = appendToBody('<input type="reset">');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error if an input is used', () => {
  appendToBody('<input>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if a reset button is used', () => {
  const el = appendToBody('<button type="reset" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error if a button is used', () => {
  appendToBody('<button />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
