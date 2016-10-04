it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('All legends must be the first child of a fieldset');
});

it('adds an error if a legend is not in a fieldset', () => (
  whenDomChanges(() => {
    el = appendElement('legend');
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('adds an error if a legend is not the first child of a fieldset', () => (
  whenDomChanges(() => {
    el = appendElement('legend');
    const fieldset = appendElement('fieldset');
    fieldset.appendChild(appendElement('div', {}, 'Lorem ipsum'));
    fieldset.appendChild(el);
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('does not an error if a legend is the first child of a fieldset', () => (
  whenDomChanges(() => {
    el = appendElement('legend');
    const fieldset = appendElement('fieldset');
    fieldset.appendChild(el);
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));
