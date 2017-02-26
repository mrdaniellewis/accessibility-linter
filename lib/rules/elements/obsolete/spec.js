proxy(fn => fn(window.AccessibilityLinter.config, 'elements', {
  foo: { obsolete: true },
}));

it('does not add an error for non-obsolete elements', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for an obsolete element', when(() => {
  el = appendToBody('<foo />');
}).then(() => {
  expect(logger).toHaveEntries(['do not use obsolete elements', el]);
}));
