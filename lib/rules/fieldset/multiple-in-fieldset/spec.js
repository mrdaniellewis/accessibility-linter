const message = 'Multiple inputs with the same name should be in a fieldset';

['input', 'textarea', 'select'].forEach((name) => {
  context(`for <${name}>`, () => {
    context('within a form', () => {
      it('does not add an error if the control has no name', () => {
        appendToBody(`<form><${name} /></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if the input is unique', () => {
        appendToBody(`<form><${name} name="x" /></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if a hidden input has the same name', () => {
        appendToBody(`<form><${name} name="x" /><input type="hidden" name="x" /></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if an input is unique within a form', () => {
        appendToBody(`<form><${name} name="x" /></form>`);
        appendToBody(`<form><${name} name="x" /></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if the inputs are in a fieldset', () => {
        appendToBody(`<form><fieldset><${name} name="x" /><${name} name="x" /></fieldset></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('adds an error if the inputs are not in a fieldset', () => {
        const container = appendToBody(`<form><${name} name="x" /><${name} name="x" /></form>`);
        const el = container.querySelector(name);
        const el2 = el.nextSibling;
        return whenDomUpdates(() => {
          expect(logger).toHaveEntries([message, el], [message, el2]);
        });
      });
    });

    context('outside of a form', () => {
      it('does not add an error if the control has no name', () => {
        appendToBody(`<${name} />`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if the input is unique', () => {
        appendToBody(`<${name} name="x" />`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if a hidden input has the same name', () => {
        appendToBody(`<${name} name="x" /><input type="hidden" name="x" />`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if an input is unique outside of the form', () => {
        appendToBody(`<${name} name="x" />`);
        appendToBody(`<form><${name} name="x" /></form>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('does not add an error if the inputs are in a fieldset', () => {
        appendToBody(`<fieldset><${name} name="x" /><${name} name="x" /></fieldset>`);
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('adds an error if the inputs are not in a fieldset', () => {
        const el = appendToBody(`<${name} name="x" /><${name} name="x" />`);
        const el2 = el.nextSibling;
        return whenDomUpdates(() => {
          expect(logger).toHaveEntries([message, el], [message, el2]);
        });
      });
    });
  });
});

['button', 'submit', 'reset', 'image'].forEach((type) => {
  context(`for <input type="${type}">`, () => {
    it('does not add an error for inputs with shared names', () => {
      appendToBody(`<input type="${type}" name="x" /><input type="text" name="x" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});
