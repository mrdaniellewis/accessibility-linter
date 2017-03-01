['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'].forEach((name) => {
  describe(`<${name}>`, () => {
    it('it does not generate an error for no form element', when(() => {
      appendToBody(`<${name}></${name}>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('adds an error for an empty form element', when(() => {
      el = appendToBody(`<${name} form></${name}>`);
    }).then(() => {
      expect(logger).toHaveEntries(['form attribute should be an id', el]);
    }));

    it('adds an error for a form attribute containing spaces', when(() => {
      el = appendToBody(`<${name} form=" "></${name}>`);
    }).then(() => {
      expect(logger).toHaveEntries(['form attribute should not contain spaces', el]);
    }));

    it('adds an error if the form attribute is not the id of an element', when(() => {
      el = appendToBody(`<${name} form="foo"></${name}>`);
    }).then(() => {
      expect(logger).toHaveEntries(['cannot find element for form attribute with id "foo"', el]);
    }));

    it('adds an error if the form attribute is not the id of a form', when(() => {
      const id = uniqueId();
      el = appendToBody(`<${name} form="${id}"></${name}><div id="${id}" />`);
    }).then(() => {
      expect(logger).toHaveEntries(['form attribute does not point to a form', el]);
    }));

    it('adds errors for hidden elements', when(() => {
      el = appendToBody(`<${name} style="display: none" form></${name}>`);
    }).then(() => {
      expect(logger).toHaveEntries(['form attribute should be an id', el]);
    }));
  });
});
