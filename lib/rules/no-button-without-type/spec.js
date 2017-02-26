const message = 'all buttons should have a type attribute';

it('does not generate an error message with a type attribute', when(() => {
  appendToBody('<button type="button" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('generates an error message without a type attribute', when(() => {
  el = appendToBody('<button />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
