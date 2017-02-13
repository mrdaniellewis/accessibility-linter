proxy(fn => fn(window.AccessibilityLinter.config, 'ariaAttributes', {
  foo: {},
  bar: {},
}));

it('does not generate an error for attributes', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for allowed attributes', when(() => {
  appendToBody('<div aria-foo="" aria-bar="" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

context('invalid attributes', () => {
  it('adds errors for unknown attributes', when(() => {
    el = appendToBody('<div aria-foo="" aria-foe="" aria-thumb="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['element has unknown aria attributes: aria-foe, aria-thumb', el]);
  }));

  it('adds an error for an unknown attribute', when(() => {
    el = appendToBody('<div aria-foo="" aria-foe="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['element has unknown aria attribute: aria-foe', el]);
  }));

  it('adds errors for hidden elements', when(() => {
    el = appendToBody('<div aria-foe="" style="display: none;" />');
  }).then(() => {
    expect(logger).toHaveEntries(['element has unknown aria attribute: aria-foe', el]);
  }));
});
