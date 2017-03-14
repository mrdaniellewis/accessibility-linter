const message = 'links with a href must have a label';

it('does not add an error for links with a href and label', () => {
  appendToBody('<a href="#">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for links without a href and label', () => {
  appendToBody('<a />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for links that are hidden', () => {
  appendToBody('<a href="#" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for links without a label', () => {
  const el = appendToBody('<a href="#" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
