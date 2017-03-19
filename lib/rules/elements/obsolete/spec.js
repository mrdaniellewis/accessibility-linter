proxy(fn => fn(window.AccessibilityLinter.config, 'elements', {
  foo: { obsolete: true },
}));

it('does not add an error for non-obsolete elements', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for an obsolete element', () => {
  const el = appendToBody('<foo />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not use obsolete elements', el]);
  });
});
