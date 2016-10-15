(function () {
  'use strict';
  const specs = window.testSpecs = new Map([
    [
      "alt",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('missing alt attribute');
        });

        it('adds an error for images without an alt tag', when(() => {
          el = appendToBody('<img>');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error for images with an alt tag', when(() => {
          appendToBody('<img alt="foo">');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error for images with an empty alt tag', when(() => {
          el = appendToBody('<img alt="">');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "fieldset/checkbox-groups-in-fieldset",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        let el2;

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('All checkbox groups must be within a fieldset');
        });

        context('within a form', () => {
          it('does not add an error if a checkbox has no name', when(() => {
            appendToBody('<form><input type="checkbox"></form>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox name is unique', when(() => {
            appendToBody('<form><input type="checkbox" name="x"></form>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox name is unique within a form', when(() => {
            appendToBody('<form><input type="checkbox" name="x"></form>');
            appendToBody('<form><input type="checkbox" name="x"></form>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox group is in a fieldset', when(() => {
            appendToBody('<form><fieldset><input type="checkbox" name="x"><input type="checkbox" name="x"></fieldset></form>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('adds an error if checkbox group is not in a fieldset', when(() => {
            appendToBody('<form><input type="checkbox" name="x"><input type="checkbox" name="x"></form>');
            el = $('input')[0];
            el2 = $('input')[1];
          }).then(() => {
            expect(logger).toHaveEntries([test, el], [test, el2]);
          }));
        });

        context('outside of a form', () => {
          it('does not add an error if a checkbox has no name', when(() => {
            appendToBody('<input type="checkbox">');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox name is unique', when(() => {
            appendToBody('<input type="checkbox" name="x">');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox name is unique outside of a form', when(() => {
            appendToBody('<input type="checkbox" name="x">');
            appendToBody('<form><input type="checkbox" name="x"></form>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('does not add an error if a checkbox group is in a fieldset', when(() => {
            appendToBody('<fieldset><input type="checkbox" name="x"><input type="checkbox" name="x"></fieldset>');
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));

          it('adds an error if checkbox group is not in a fieldset', when(() => {
            appendToBody('<input type="checkbox" name="x"><input type="checkbox" name="x">');
            el = $('input')[0];
            el2 = $('input')[1];
          }).then(() => {
            expect(logger).toHaveEntries([test, el], [test, el2]);
          }));
        });
      },
    ],
    [
      "fieldset/fieldset-has-legend",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('All fieldsets must have a legend');
        });

        it('adds an error if a fieldset is empty', when(() => {
          el = appendToBody('<fieldset>');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('adds an error if a fieldset does not have a legend', when(() => {
          el = appendToBody('<fieldset><div>Lorem ipsum</div></fieldset>');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('adds an error if a fieldset has a legend that is not the first child', when(() => {
          el = appendToBody(`<fieldset>
            <div>Lorem ipsum</div>
            <legend>legend</legend>
          </fieldset>`);
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if the fieldset has a legend as the first child', when(() => {
          el = appendToBody('<fieldset><legend>legend</legend></fieldset>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a fieldset has a legend that is empty', when(() => {
          el = appendToBody('<fieldset><legend></legend></fieldset>');
        }).then(() => {
          expect(this.logger).toHaveEntries([this.test, el]);
        }));
      },
    ],
    [
      "fieldset/legend-has-fieldset",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('All legends must be the first child of a fieldset');
        });

        it('adds an error if a legend is not in a fieldset', when(() => {
          el = appendToBody('<legend>');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('adds an error if a legend is not the first child of a fieldset', when(() => {
          appendToBody(`
            <fieldset>
              <p>Lorem ispum</p>
              <legend>legend</legend>
            </fieldset>
          `);
          el = $('legend')[0];
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not an error if a legend is the first child of a fieldset', when(() => {
          appendToBody(`
            <fieldset>
              <legend>legend</legend>
              Lorem ispum
            </fieldset>
          `);
          el = $('legend')[0];
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "fieldset/radios-in-fieldset",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(this.test).toGenerateErrorMessage('All radio inputs must be within a fieldset');
        });

        it('adds an error if a radio is not in a fieldset', when(() => {
          el = appendToBody('<input type="radio">');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if a radio is in a fieldset', when(() => {
          appendToBody('<fieldset><input type="radio"></fieldset>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "headings",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(this.test).toGenerateErrorMessage('Headings must be nested correctly');
        });

        const heading = i => `<h${i}>heading</h${i}>`;

        [2, 3, 4, 5, 6].forEach((h) => {
          it(`it adds an error for a <h${h}> with no proceeding heading`, when(() => {
            el = appendToBody(`<h${h}>Heading</h${h}>`);
          }).then(() => {
            expect(logger).toHaveEntries([test, el]);
          }));

          [1, 2, 3, 4, 5, 6].forEach((p) => {
            const errors = p + 1 < h;
            it(`it ${errors ? 'adds' : 'does not add'} an error for a sibling <h${h}> after a <h${p}>`, when(() => {
              for (let i = 1; i <= p; ++i) {
                appendToBody(`${heading(i)}<p>paragraph</p>text`);
              }
              el = appendToBody(heading(h));
            }).then(() => {
              if (errors) {
                expect(logger).toHaveEntries([test, el]);
              } else {
                expect(logger).toNotHaveEntries();
              }
            }));

            it(`it ${errors ? 'adds' : 'does not add'} an error for an ancestor <h${h}> after a <h${p}>`, when(() => {
              let $section = $('body');
              for (let i = 1; i <= p; ++i) {
                $section = $(`<section>${heading(i)}<p>paragraph</p>text</section>`).appendTo($section);
              }
              el = $(heading(h)).appendTo($section)[0];
            }).then(() => {
              if (errors) {
                expect(logger).toHaveEntries([test, el]);
              } else {
                expect(logger).toNotHaveEntries();
              }
            }));

            it(`it ${errors ? 'adds' : 'does not add'} an error for a <h${h}> after a <h${p}> in a parent`, when(() => {
              let $section = $('body');
              for (let i = 1; i <= p; ++i) {
                $section = $(`<section>${heading(i)}<p>paragraph</p>text</section>`).appendTo($section);
              }
              el = appendToBody(heading(h));
            }).then(() => {
              if (errors) {
                expect(logger).toHaveEntries([test, el]);
              } else {
                expect(logger).toNotHaveEntries();
              }
            }));
          });
        });
      },
    ],
    [
      "label/inputs-are-labelled",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('all form elements must have a label');
        });

        ['input', 'select', 'textarea'].forEach((name) => {
          describe(`for <${name}>`, () => {
            it('adds an error if there is no label', when(() => {
              el = appendToBody(`<${name} />`);
            }).then(() => {
              expect(logger).toHaveEntries([test, el]);
            }));

            it('does not add an error for an aria-labelledby label', when(() => {
              const id = uniqueId();
              appendToBody(`<${name} aria-labelledby="${id}"/><p id="${id}">label</p>`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does not add an error for an aria-label label', when(() => {
              appendToBody(`<${name} aria-label="label" />`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does not add an error for an explicit label', when(() => {
              const id = uniqueId();
              appendToBody(`<${name} id="${id}"/><label for="${id}">label</label>`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does not add an error for an implicit label', when(() => {
              appendToBody(`<label>label<${name} /></label>`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does not an error if aria-labelledby is missing and other labels are present', when(() => {
              el = appendToBody(`<${name} aria-label="label" aria-labelledby="${uniqueId()}"/>`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does add an error if aria-labelledby is empty and other labels are present', when(() => {
              const id = uniqueId();
              el = appendToBody(`
                <${name} aria-label="label" aria-labelledby="${id}"/>
                <p id="${id}"></p>
              `);
            }).then(() => {
              expect(logger).toHaveEntries([test, el]);
            }));

            it('does add an error if aria-label is empty, and an associated label is present', when(() => {
              const id = uniqueId();
              el = appendToBody(`
                <${name} aria-label="" id="${id}"/>
                <label for="${id}">label</label>
              `);
            }).then(() => {
              expect(logger).toHaveEntries([test, el]);
            }));

            it('does add an error if the explicit label is empty, and an implicit label is present', when(() => {
              const id = uniqueId();
              appendToBody(`
                <label><${name} id="${id}"/>label</label>
                <label for="${id}"></label>
              `);
              el = $(name)[0];
            }).then(() => {
              expect(logger).toHaveEntries([test, el]);
            }));

            it('does not add an error if the explicit label is missing, and an implicit label is present', when(() => {
              const id = uniqueId();
              appendToBody(`
                <label><${name} id="${id}"/>label</label>
              `);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does add an error if the implict label is empty', when(() => {
              appendToBody(`<label><${name} /></label>`);
              el = $(name)[0];
            }).then(() => {
              expect(logger).toHaveEntries([test, el]);
            }));
          });
        });

        ['submit', 'reset', 'image', 'button', 'hidden'].forEach((type) => {
          it(`does not add errors for <input type="${type}">`, when(() => {
            appendToBody(`<label><input type="${type}" /></label>`);
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));
        });
      },
    ],
    [
      "label/labels-have-inputs",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('all labels must be linked to a control');
        });

        it('adds an error for labels without a for attribute', when(() => {
          el = appendToBody('<label>');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('adds an error for labels without an associated control', when(() => {
          el = appendToBody(`<label for="${uniqueId()}">`);
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error for labels with an associated control', when(() => {
          const id = uniqueId();
          el = appendToBody(`<label for="${id}"><input id="${id}">`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-empty-select",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('Selects should have options');
        });

        it('adds an error if a select has no options', when(() => {
          el = appendToBody('<select />');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if a select has options', when(() => {
          appendToBody('<select><option></select>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-multiple-select",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('Do not use multiple selects');
        });

        it('adds an error if a multiple select is used', when(() => {
          el = appendToBody('<select multiple />');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if an normal select is used', when(() => {
          appendToBody('<select />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-reset",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('Do not use reset buttons');
        });

        it('adds an error if a reset input is used', when(() => {
          el = appendToBody('<input type="reset">');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if an input is used', when(() => {
          appendToBody('<input>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a reset button is used', when(() => {
          el = appendToBody('<button type="reset" />');
        }).then(() => {
          expect(logger).toHaveEntries([test, el]);
        }));

        it('does not add an error if a button is used', when(() => {
          appendToBody('<button />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "unique-id",
      function() {
        let el, test, logger, linter, window, document, $, appendToBody;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody } } = this);
        });

        beforeEach(() => {
          ({test, logger, linter} = this);
        });

        let el2;

        it('generates the expected error message', () => {
          expect(test).toGenerateErrorMessage('id is not unique');
        });

        it('adds an error if an id is not unique', when(() => {
          const id = uniqueId();
          el = appendToBody(`<div id="${id}" />`);
          el2 = appendToBody(`<div id="${id}" />`);
        }).then(() => {
          expect(logger).toHaveEntries([test, el], [test, el2]);
        }));

        it('does not add an error if ids are unique', when(() => {
          appendToBody(`<div id="${uniqueId()}" />`);
          appendToBody(`<div id="${uniqueId()}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('ignores empty ids', when(() => {
          appendToBody('<div id />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
  ]);
}());