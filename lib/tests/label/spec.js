it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('all form elements must have a label');
});

['input', 'select', 'textarea'].forEach(name => {
  describe(`for <${name}>`, () => {
    it('adds an error if there is no label', () => (
      whenDomChanges(() => {
        el = appendElement(name);
      })
      .then(() => {
        expect(this.logger).toHaveEntries([this.test, el]);
      })
    ));

    it('does not add an error for an aria-labelledby label', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        appendElement('p', { id }, 'label');
        el = appendElement(name, { 'aria-labelledby': id });
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));

    it('does not add an error for an aria-label label', () => (
      whenDomChanges(() => {
        el = appendElement(name, { 'aria-label': 'label' });
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));

    it('does not add an error for an explict label', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        appendElement('label', { for: id }, 'label');
        el = appendElement(name, { id });
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));

    it('does not add an error for an implicit label', () => (
      whenDomChanges(() => {
        const label = appendElement('label', {}, 'label');
        el = appendElement(name);
        label.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));

    it('does not an error if aria-labelledby is missing and other labels are present', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        el = appendElement(name, { 'aria-labelledby': id, 'aria-label': 'label' });
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));

    it('does add an error if aria-labelledby is empty and other labels are present', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        const id2 = uniqueId();
        appendElement('label', { for: id });
        appendElement('p', { id2 });
        el = appendElement(name, { id, 'aria-labelledby': id, 'aria-label': 'label' });
        const implicit = appendElement('label', {}, 'label');
        implicit.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toHaveEntries([this.test, el]);
      })
    ));

    it('does add an error if aria-label is empty, and implicit/explicit labels are present', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        appendElement('label', { for: id });
        el = appendElement(name, { id, 'aria-label': '' });
        const implicit = appendElement('label', {}, 'label');
        implicit.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toHaveEntries([this.test, el]);
      })
    ));

    it('does add an error if the explict label is empty, and an implict label is present', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        appendElement('label', { for: id });
        el = appendElement(name, { id });
        const implicit = appendElement('label', {}, 'label');
        implicit.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toHaveEntries([this.test, el]);
      })
    ));

    it('does not add an error if the explicit label is missing, and an implicit label is present', () => (
      whenDomChanges(() => {
        const id = uniqueId();
        el = appendElement(name, { id });
        const implicit = appendElement('label', {}, 'label');
        implicit.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toNotHaveEntries();
      })
    ));


    it('does add an error if the implict label is empty', () => (
      whenDomChanges(() => {
        const label = appendElement('label', {});
        el = appendElement(name);
        label.appendChild(el);
      })
      .then(() => {
        expect(this.logger).toHaveEntries([this.test, el]);
      })
    ));
  });
});

['submit', 'reset', 'image', 'button', 'hidden'].forEach(type => {
  it(`does not add errors for <input type="${type}">`, () => (
    whenDomChanges(() => {
      el = appendElement('input', { type });
    })
    .then(() => {
      expect(this.logger).toNotHaveEntries();
    })
  ));
});
