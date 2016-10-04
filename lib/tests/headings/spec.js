it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('Headings must be nested correctly');
});

it('it adds an error if a ', () => (
  whenDomChanges(() => {
    el = appendElement('fieldset');
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('adds an error if a fieldset does not have a legend', () => (
  whenDomChanges(() => {
    el = appendElement('fieldset');
    el.appendChild(appendElement('div', {}, 'Lorem ipsum'));
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('adds an error if a fieldset has a legend that is not the first child', () => (
  whenDomChanges(() => {
    el = appendElement('fieldset');
    el.appendChild(appendElement('div', {}, 'Lorem ipsum'));
    el.appendChild(appendElement('legend', {}, 'Legend'));
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));

it('does not add an error if the fieldset has a legend as the first child', () => (
  whenDomChanges(() => {
    el = appendElement('fieldset');
    el.appendChild(appendElement('legend', {}, 'Legend'));
  })
  .then(() => {
    expect(this.logger).toNotHaveEntries();
  })
));

it('adds an error if a fieldset has a legend that is empty', () => (
  whenDomChanges(() => {
    el = appendElement('fieldset');
    el.appendChild(appendElement('legend'));
  })
  .then(() => {
    expect(this.logger).toHaveEntries([this.test, el]);
  })
));
