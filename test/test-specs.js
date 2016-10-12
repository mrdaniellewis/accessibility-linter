(function () {
  'use strict';
  const specs = window.testSpecs = new Map([
    [
      "alt",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('missing alt attribute');
        });

        it('adds an error for images without an alt tag', when(() => {
          el = $('<img>').appendTo('body');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error for images with an alt tag', when(() => {
          el = $('<img alt="foo">').appendTo('body');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error for images with an empty alt tag', when(() => {
          el = $('<img alt="">').appendTo('body');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "fieldset-legend",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

        it('generates the expected error message', () => {
          expect(this.test).toGenerateErrorMessage('All fieldsets must have a legend');
        });

        it('adds an error if a fieldset is empty', () => (
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
      },
    ],
    [
      "headings",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

        it('generates the expected error message', () => {
          expect(this.test).toGenerateErrorMessage('Headings must be nested correctly');
        });

        [1, 2, 3, 4, 5, 6].forEach(h => {
          [1, 2, 3, 4, 5, 6].forEach(p => {
            if (p + 1 < h) {
              it(`it adds an error for a <h${h}> that is after a <h${p}>`, () => (
                whenDomChanges(() => {
                  let level = p;
                  while (level > 0) {
                    appendElement(`h${level}`);
                    --level;
                  }
                  el = appendElement('h1');
                })
                .then(() => {
                  expect(this.logger).toHaveEntries([this.test, el]);
                })
              ));
            }
          });
        });
      },
    ],
    [
      "label",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

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
      },
    ],
    [
      "label-associated",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

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
      },
    ],
    [
      "legend",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

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
      },
    ],
    [
      "radio-fieldset",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

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
      },
    ],
    [
      "unique-id",
      function(context) {
        let el, test, logger, linter, window, document, $, when;

        before(() => {
          ({ context: { window }, context: { window: { document, when, $ } } } = context);
        });

        beforeEach(() => {
          ({test, logger, linter} = context);
        });

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
      },
    ],
  ]);
}());