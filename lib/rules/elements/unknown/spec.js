proxy(fn => fn(window.AccessibilityLinter.config, 'elements', {
  foo: {},
  body: {},
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
