it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('missing alt attribute');
});

it('adds an error for images without an alt tag', () => (
  whenDomChanges(() => {
    el = appendElement('img');
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('does not add an error for images with an alt tag', () => (
  whenDomChanges(() => {
    el = appendElement('img', { alt: '' });
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));
