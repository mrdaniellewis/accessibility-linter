proxy(fn => fn(window.AccessibilityLinter.config, 'ariaAttributes', {
  foo: {},
  bar: { deprecated: true },
  thumb: { deprecated: true },
}));

it('does not generate an error for unknown attributes', () => {
  appendToBody('<div aria-unknown />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for valid attributes', () => {
  appendToBody('<div aria-foo />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generates errors for deprecated attributes', () => {
  const el = appendToBody('<div aria-bar aria-thumb aria-foo />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(
      ['aria-bar is deprecated', el],
      ['aria-thumb is deprecated', el]
    );
  });
});

it('does generates errors for hidden elements', () => {
  const el = appendToBody('<div aria-bar style="display: none;"/>');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['aria-bar is deprecated', el]);
  });
});
