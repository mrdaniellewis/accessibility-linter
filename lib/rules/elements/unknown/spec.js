proxy(fn => fn(window.AccessibilityLinter.config, 'elements', {
  foo: {},
  body: {},
  svg: {},
  math: {},
}));

it('does not add an error for known elements', when(() => {
  appendToBody('<foo />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for an unknown element', when(() => {
  el = appendToBody('<frank />');
}).then(() => {
  expect(logger).toHaveEntries(['unknown element', el]);
}));

it('does not add an error for svg subtree', when(() => {
  el = appendToBody('<svg><path d="M150 0 L75 200 L225 200 Z" /></svg>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for math subtree', when(() => {
  el = appendToBody('<math><mi>x</mi><mo>=</mo><mi>y</mi>></svg>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
