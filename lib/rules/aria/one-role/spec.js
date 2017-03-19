it('does not add an error for an empty role', () => {
  appendToBody('<div role />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for a single role', () => {
  appendToBody('<div role="foo" />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for additional white space', () => {
  appendToBody('<div role=" foo " />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for multiple roles', () => {
  const el = appendToBody('<div role="foo bar" />');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not add multiple roles', el]);
  });
});

it('does not add an error for "none presentation"', () => {
  appendToBody('<div role="none presentation" />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
