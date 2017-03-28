it('does not add an error an element with no tabindex', () => {
  appendToBody('<div />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error an element with a tabindex of -1', () => {
  appendToBody('<div tabindex="-1" />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error an element with a tabindex of 0', () => {
  appendToBody('<div tabindex="-1" />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error an element with a tabindex greater than 0', () => {
  const el = appendToBody('<div tabindex="1" />');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no tabindex greater than 0', el]);
  });
});

it('does not add an error for a hidden element', () => {
  appendToBody('<div tabindex="1" hidden />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
