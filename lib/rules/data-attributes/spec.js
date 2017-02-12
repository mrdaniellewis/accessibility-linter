const message = 'data is an attribute prefix';

it('does not an error for element with allowed attributes', when(() => {
  appendToBody('<div data-foo="bar" data-fee="foo" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error for element with a "data" attribute', when(() => {
  el = appendToBody('<div data="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('adds an error for element with a "data-" attribute', when(() => {
  el = appendToBody('<div data-="bar" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
