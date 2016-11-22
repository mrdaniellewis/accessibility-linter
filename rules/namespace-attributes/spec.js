it('generates the expected error message', () => {
  el = appendToBody('<test data />');
  expect(rule).toGenerateErrorMessage({ for: el }, 'invalid attribute: data');
});

it('generates the expected error message', () => {
  el = appendToBody('<test data data- />');
  expect(rule).toGenerateErrorMessage({ for: el }, 'invalid attributes: data, data-');
});

it('does not an error for element with allowed attributes', when(() => {
  appendToBody('<div data-foo="bar" data-fee="foo" />');
}).then(() => {
  expect(logger).toNotHaveEntries([rule, el]);
}));

it('adds an error for element with a "data" attribute', when(() => {
  el = appendToBody('<div data="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error for element with a "data-" attribute', when(() => {
  el = appendToBody('<div data-="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error for element with a "aria" attribute', when(() => {
  el = appendToBody('<div aria="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error for element with a "aria-" attribute', when(() => {
  el = appendToBody('<div aria-="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));
