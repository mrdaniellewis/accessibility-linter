it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('All radio inputs must be within a fieldset');
});

it('adds an error if a radio is not in a fieldset', () => (
  whenDomChanges(() => {
    el = appendElement('input', { type: 'radio' });
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('does not add an error if a radio is in a fieldset', () => (
  whenDomChanges(() => {
    el = appendElement('input', { type: 'radio' });
    const fieldset = appendElement('fieldset');
    fieldset.appendChild(el);
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));
