it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('all labels must be linked to a control');
});

it('adds an error for labels without a for attribute', () => (
  whenDomChanges(() => {
    el = appendElement('label');
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('adds an error for labels without an associated control', () => (
  whenDomChanges(() => {
    const id = uniqueId();
    el = appendElement('label', { for: id });
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('does not add an error for labels with an associated control', () => (
  whenDomChanges(() => {
    const id = uniqueId();
    appendElement('input', { id });
    el = appendElement('label', { for: id });
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));
