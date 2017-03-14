const message = 'focusable elements must have a label';

it('does not add an error if an element with no tabindex has no label', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if an element with no tabindex has no label', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if an element with a tabindex has a label', () => {
  appendToBody('<div tabindex="-1" aria-label="foo" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if an element with a tabindex is hidden', () => {
  appendToBody('<div tabindex="-1" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if an element with a tabindex has no label', () => {
  const el = appendToBody('<div tabindex="-1" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
