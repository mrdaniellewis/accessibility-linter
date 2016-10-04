it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('id is not unique');
});

it('adds an error if an id is not unique', () => {
  let el2;
  return whenDomChanges(() => {
    const id = uniqueId();
    el = appendElement('div', { id });
    el2 = appendElement('div', { id });
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el], [this.test, el2]);
  });
});

it('does not add an error if ids are unique', () => (
  whenDomChanges(() => {
    appendElement('div', { id: uniqueId() });
    appendElement('div', { id: uniqueId() });
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));

it('ignores empty ids', () => (
  whenDomChanges(() => {
    appendElement('div', { id: '' });
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));
