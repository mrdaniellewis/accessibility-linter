proxy(fn => fn(window.AccessibilityLinter.config, 'ariaAttributes', {
  foo: {},
  bar: {},
}));

it('does not generate an error for attributes', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for allowed attributes', () => {
  appendToBody('<div aria-foo="" aria-bar="" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

context('invalid attributes', () => {
  it('adds errors for unknown attributes', () => {
    const el = appendToBody('<div aria-foo="" aria-foe="" aria-thumb="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['element has unknown aria attributes: aria-foe, aria-thumb', el]);
    });
  });

  it('adds an error for an unknown attribute', () => {
    const el = appendToBody('<div aria-foo="" aria-foe="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['element has unknown aria attribute: aria-foe', el]);
    });
  });

  it('adds errors for hidden elements', () => {
    const el = appendToBody('<div aria-foe="" style="display: none;" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['element has unknown aria attribute: aria-foe', el]);
    });
  });
});
