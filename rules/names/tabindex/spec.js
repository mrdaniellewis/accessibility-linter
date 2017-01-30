it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('focusable elements must have a label');
});

it('does not add an error if an element with no tabindex has no label', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if an element with no tabindex has no label', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if an element with a tabindex has a label', when(() => {
  appendToBody('<div tabindex="-1" aria-label="foo" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if an element with a tabindex is hidden', when(() => {
  appendToBody('<div tabindex="-1" aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if an element with a tabindex has no label', when(() => {
  el = appendToBody('<div tabindex="-1" />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));
