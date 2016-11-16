it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('Multiple inputs with the same name should be in a fieldset');
});

['input', 'textarea', 'select'].forEach((name) => {
  context(`for <${name}>`, () => {
    context('within a form', () => {
      it('does not add an error if the control has no name', when(() => {
        appendToBody(`<form><${name} /></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if the input is unique', when(() => {
        appendToBody(`<form><${name} name="x" /></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if a hidden input has the same name', when(() => {
        appendToBody(`<form><${name} name="x" /><input type="hidden" name="x" /></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if an input is unique within a form', when(() => {
        appendToBody(`<form><${name} name="x" /></form>`);
        appendToBody(`<form><${name} name="x" /></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if the inputs are in a fieldset', when(() => {
        appendToBody(`<form><fieldset><${name} name="x" /><${name} name="x" /></fieldset></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('adds an error if the inputs are not in a fieldset', when(() => {
        appendToBody(`<form><${name} name="x" /><${name} name="x" /></form>`);
        el = $(name)[0];
        el2 = $(name)[1];
      }).then(() => {
        expect(logger).toHaveEntries([test, el], [test, el2]);
      }));
    });

    context('outside of a form', () => {
      it('does not add an error if the control has no name', when(() => {
        appendToBody(`<${name} />`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if the input is unique', when(() => {
        appendToBody(`<${name} name="x" />`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if a hidden input has the same name', when(() => {
        appendToBody(`<${name} name="x" /><input type="hidden" name="x" />`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if an input is unique outside of the form', when(() => {
        appendToBody(`<${name} name="x" />`);
        appendToBody(`<form><${name} name="x" /></form>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('does not add an error if the inputs are in a fieldset', when(() => {
        appendToBody(`<fieldset><${name} name="x" /><${name} name="x" /></fieldset>`);
      }).then(() => {
        expect(logger).toNotHaveEntries();
      }));

      it('adds an error if the inputs are not in a fieldset', when(() => {
        appendToBody(`<${name} name="x" /><${name} name="x" />`);
        el = $(name)[0];
        el2 = $(name)[1];
      }).then(() => {
        expect(logger).toHaveEntries([test, el], [test, el2]);
      }));
    });
  });
});
