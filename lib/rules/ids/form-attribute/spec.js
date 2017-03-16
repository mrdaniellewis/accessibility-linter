['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'].forEach((name) => {
  describe(`<${name}>`, () => {
    it('it does not generate an error for no form element', () => {
      appendToBody(`<${name}></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('adds an error for an empty form element', () => {
      const el = appendToBody(`<${name} form></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors(['form attribute should be an id', el]);
      });
    });

    it('adds an error for a form attribute containing spaces', () => {
      const el = appendToBody(`<${name} form=" "></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors(['form attribute should not contain spaces', el]);
      });
    });

    it('adds an error if the form attribute is not the id of an element', () => {
      const el = appendToBody(`<${name} form="foo"></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors(['cannot find element for form attribute with id "foo"', el]);
      });
    });

    it('adds an error if the form attribute is not the id of a form', () => {
      const id = uniqueId();
      const el = appendToBody(`<${name} form="${id}"></${name}><div id="${id}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors(['form attribute does not point to a form', el]);
      });
    });
  });
});
