proxy(fn => fn(window.AccessibilityLinter.config, 'ariaAttributes', {
  foo: {},
  bar: { deprecated: true },
  thumb: { deprecated: true },
}));

it('does not generate an error for unknown attributes', when(() => {
  appendToBody('<div aria-unknown />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for valid attributes', when(() => {
  appendToBody('<div aria-foo />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does generates errors for deprecated attributes', when(() => {
  el = appendToBody('<div aria-bar aria-thumb aria-foo />');
}).then(() => {
  expect(logger).toHaveEntries(
    ['aria-bar is deprecated', el],
    ['aria-thumb is deprecated', el]
  );
}));

it('does generates errors for hidden elements', when(() => {
  el = appendToBody('<div aria-bar style="display: none;"/>');
}).then(() => {
  expect(logger).toHaveEntries(['aria-bar is deprecated', el]);
}));
