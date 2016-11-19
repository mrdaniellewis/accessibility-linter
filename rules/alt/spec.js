it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('missing alt attribute');
});

it('adds an error for images without an alt tag', when(() => {
  el = appendToBody('<img>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not add an error for images with an alt tag', when(() => {
  appendToBody('<img alt="foo">');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for images with an empty alt tag', when(() => {
  el = appendToBody('<img alt="">');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
