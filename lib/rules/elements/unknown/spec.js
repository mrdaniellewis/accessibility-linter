proxy(fn => fn(window.AccessibilityLinter.config, 'elements', {
  foo: {},
  body: {},
  svg: {},
  math: {},
}));

it('does not add an error for known elements', () => {
  appendToBody('<foo />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for an unknown element', () => {
  const el = appendToBody('<frank />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['unknown element', el]);
  });
});

it('does not add an error for svg subtree', () => {
  appendToBody('<svg><path d="M150 0 L75 200 L225 200 Z" /></svg>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for math subtree', () => {
  appendToBody('<math><mi>x</mi><mo>=</mo><mi>y</mi>></svg>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
