it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('missing alt attribute');
});

it('adds an error for images without an alt tag', when(() => {
  el = $('<img>').appendTo('body');
}).then(() => {
  expect(logger).toHaveEntries([test, el]);
}));

it('does not add an error for images with an alt tag', when(() => {
  el = $('<img alt="foo">').appendTo('body');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for images with an empty alt tag', when(() => {
  el = $('<img alt="">').appendTo('body');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
