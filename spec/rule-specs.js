(function () {
  'use strict';
  const specs = window.ruleSpecs = new Map([
    [
      "alt",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('missing alt attribute');
        });

        it('adds an error for images without an alt tag', when(() => {
          el = appendToBody('<img>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
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
      "aria/roles",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        let originalMatch;
        let originalRoles;

        before(() => {
          const aria = window.AccessibilityLinter.standards.aria;
          originalMatch = aria.match;
          originalRoles = aria.roles;
          aria.match = (el) => {
            if (el.nodeName.toLowerCase() !== 'test') {
              throw new Error('expected test element');
            }

            return {
              implicitRoles: ['implicit'],
              allowedRoles: ['allowed1', 'allowed2'],
            };
          };

          aria.roles = ['implicit', 'allowed1', 'allowed2', 'disallowed'];
        });

        after(() => {
          window.AccessibilityLinter.standards.aria.match = originalMatch;
          window.AccessibilityLinter.standards.aria.roles = originalRoles;
        });

        it('does not generate an error for no role', when(() => {
          appendToBody('<test />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not generate an error for an allowed role', when(() => {
          appendToBody('<test role="allowed1" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        context('using an implicit role', () => {
          it('generates the expected error message', () => {
            el = appendToBody('<test role="implicit" />');
            expect(rule).toGenerateErrorMessage({ for: el }, 'role "implicit" is implicit for this element and not allowed');
          });

          it('adds an error', when(() => {
            el = appendToBody('<test role="implicit" />');
          }).then(() => {
            expect(logger).toHaveEntries([rule, el]);
          }));
        });

        context('using an unknown role', () => {
          it('generates the expected error message', () => {
            el = appendToBody('<test role="unknown" />');
            expect(rule).toGenerateErrorMessage({ for: el }, 'role "unknown" is not a known role');
          });

          it('adds an error', when(() => {
            el = appendToBody('<test role="unknown" />');
          }).then(() => {
            expect(logger).toHaveEntries([rule, el]);
          }));
        });

        context('using a disallowed role', () => {
          it('generates the expected error message', () => {
            el = appendToBody('<test role="disallowed" />');
            expect(rule).toGenerateErrorMessage({ for: el }, 'role "disallowed" is not allowed for this element');
          });

          it('adds an error', when(() => {
            el = appendToBody('<test role="disallowed" />');
          }).then(() => {
            expect(logger).toHaveEntries([rule, el]);
          }));
        });
      },
    ],
    [
      "fieldset/fieldset-has-legend",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('All fieldsets must have a legend');
        });

        it('adds an error if a fieldset is empty', when(() => {
          el = appendToBody('<fieldset>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a fieldset does not have a legend', when(() => {
          el = appendToBody('<fieldset><div>Lorem ipsum</div></fieldset>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a fieldset has a legend that is not the first child', when(() => {
          el = appendToBody(`<fieldset>
            <div>Lorem ipsum</div>
            <legend>legend</legend>
          </fieldset>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not add an error if the fieldset has a legend as the first child', when(() => {
          el = appendToBody('<fieldset><legend>legend</legend></fieldset>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a fieldset has a legend that is empty', when(() => {
          el = appendToBody('<fieldset><legend></legend></fieldset>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "fieldset/legend-has-fieldset",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('All legends must be the first child of a fieldset');
        });

        it('adds an error if a legend is not in a fieldset', when(() => {
          el = appendToBody('<legend>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
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
          expect(logger).toHaveEntries([rule, el]);
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
      "fieldset/multiple-in-fieldset",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Multiple inputs with the same name should be in a fieldset');
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
                expect(logger).toHaveEntries([rule, el], [rule, el2]);
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
                expect(logger).toHaveEntries([rule, el], [rule, el2]);
              }));
            });
          });
        });
      },
    ],
    [
      "headings",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Headings must be nested correctly');
        });

        const heading = i => `<h${i}>heading</h${i}>`;

        [2, 3, 4, 5, 6].forEach((h) => {
          it(`it adds an error for a <h${h}> with no proceeding heading`, when(() => {
            el = appendToBody(`<h${h}>Heading</h${h}>`);
          }).then(() => {
            expect(logger).toHaveEntries([rule, el]);
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
                expect(logger).toHaveEntries([rule, el]);
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
                expect(logger).toHaveEntries([rule, el]);
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
                expect(logger).toHaveEntries([rule, el]);
              } else {
                expect(logger).toNotHaveEntries();
              }
            }));
          });
        });
      },
    ],
    [
      "label/buttons-have-labels",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('buttons must have a label');
        });

        it('does not add an error if a button has a text label', when(() => {
          appendToBody('<button>text</button>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has a non-empty aria-label', when(() => {
          appendToBody('<button aria-label="label" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has a non-empty aria-labelledby', when(() => {
          const id = uniqueId();
          appendToBody(`<span id="${id}">label</span>`);
          appendToBody(`<button aria-labelledby="${id}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has non-empty multiple aria-labelledby', when(() => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          appendToBody(`<span id="${id1}">label</span>`);
          appendToBody(`<span id="${id2}">label</span>`);
          appendToBody(`<button aria-labelledby="${id1} ${id2}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a button has no label of any kind', when(() => {
          el = appendToBody('<button />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a button has an empty aria-label', when(() => {
          el = appendToBody('<button aria-label="">label</button>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a button has an empty aria-labelledby', when(() => {
          const id = uniqueId();
          appendToBody(`<span id="${id}"></span>`);
          el = appendToBody(`<button aria-label="label" aria-labelledby="${id}">label</button>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "label/inputs-are-labelled",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('all form elements must have a label');
        });

        ['input', 'select', 'textarea'].forEach((name) => {
          describe(`for <${name}>`, () => {
            it('adds an error if there is no label', when(() => {
              el = appendToBody(`<${name} />`);
            }).then(() => {
              expect(logger).toHaveEntries([rule, el]);
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
              expect(logger).toHaveEntries([rule, el]);
            }));

            it('does add an error if aria-label is empty, and an associated label is present', when(() => {
              const id = uniqueId();
              el = appendToBody(`
                <${name} aria-label="" id="${id}"/>
                <label for="${id}">label</label>
              `);
            }).then(() => {
              expect(logger).toHaveEntries([rule, el]);
            }));

            it('does add an error if the explicit label is empty, and an implicit label is present', when(() => {
              const id = uniqueId();
              appendToBody(`
                <label><${name} id="${id}"/>label</label>
                <label for="${id}"></label>
              `);
              el = $(name)[0];
            }).then(() => {
              expect(logger).toHaveEntries([rule, el]);
            }));

            it('does not add an error if the explicit label is missing, and an implicit label is present', when(() => {
              const id = uniqueId();
              appendToBody(`<label><${name} id="${id}"/>label</label>`);
            }).then(() => {
              expect(logger).toNotHaveEntries();
            }));

            it('does add an error if the implicit label is empty', when(() => {
              appendToBody(`<label><${name} /></label>`);
              el = $(name)[0];
            }).then(() => {
              expect(logger).toHaveEntries([rule, el]);
            }));

            it('does not blow up if an id needs escaping', when(() => {
              appendToBody(`
                <label for="$quot; \\">label</label>
                <label for="$quot; \\"></label>
              `);
            }).then(() => {
              expect(logger).toNotHaveEntries();
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
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('all labels must be linked to a control');
        });

        it('adds an error for labels without a for attribute', when(() => {
          el = appendToBody('<label>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error for labels without an associated control', when(() => {
          el = appendToBody(`<label for="${uniqueId()}">`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
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
      "label/links-have-labels",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('links must have a label');
        });

        it('does not add an error if a button has a text label', when(() => {
          appendToBody('<a>text</a>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has a non-empty aria-label', when(() => {
          appendToBody('<a aria-label="label" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has a non-empty aria-labelledby', when(() => {
          const id = uniqueId();
          appendToBody(`<span id="${id}">label</span>`);
          appendToBody(`<a aria-labelledby="${id}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('does not add an error if a button has non-empty multiple aria-labelledby', when(() => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          appendToBody(`<span id="${id1}">label</span>`);
          appendToBody(`<span id="${id2}">label</span>`);
          appendToBody(`<a aria-labelledby="${id1} ${id2}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a button has no label of any kind', when(() => {
          el = appendToBody('<a />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a button has an empty aria-label', when(() => {
          el = appendToBody('<a aria-label="">label</a>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a button has an empty aria-labelledby', when(() => {
          const id = uniqueId();
          appendToBody(`<span id="${id}"></span>`);
          el = appendToBody(`<a aria-label="label" aria-labelledby="${id}">label</a>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "lang",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message for a missing lang attribute', () => {
          const el = document.createElement('html');
          expect(rule).toGenerateErrorMessage({ for: el }, 'missing lang attribute');
        });

        it('generates the expected error message for an invalid lang attribute', () => {
          const el = document.createElement('html');
          el.lang = 'x';
          expect(rule).toGenerateErrorMessage({ for: el }, 'language code is invalid');
        });

        it('does not add an error if there is a valid language code', () => {
          document.documentElement.lang = 'en';
          linter.run();
          expect(logger).toNotHaveEntries();
          document.documentElement.lang = '';
        });

        it('adds an error if there is no lang attribute', () => {
          document.documentElement.removeAttribute('lang');
          linter.run();
          expect(logger).toHaveEntries([rule, document.documentElement]);
        });

        it('adds an error if there is an invalid lang attribute', () => {
          document.documentElement.lang = 'x';
          linter.run();
          expect(logger).toHaveEntries([rule, document.documentElement]);
          document.documentElement.lang = '';
        });

        describe('valid lang attributes', () => {
          it('validates simple tags', () => {
            expect(rule.match.test('de')).toBe(true);
          });

          it('validates language-scripts', () => {
            expect(rule.match.test('zh-Hant')).toBe(true);
          });

          it('validates extended language', () => {
            expect(rule.match.test('zh-cmn-Hans-CN')).toBe(true);
          });

          it('validates three letter language', () => {
            expect(rule.match.test('yue-HK')).toBe(true);
          });

          it('validates language-script-region', () => {
            expect(rule.match.test('sr-Latn-RS')).toBe(true);
          });

          it('validates language-variant', () => {
            expect(rule.match.test('sl-rozaj-biske')).toBe(true);
          });

          it('validates language-region-variant', () => {
            expect(rule.match.test('de-CH-1901')).toBe(true);
          });

          it('validates language-script-region-variant', () => {
            expect(rule.match.test('hy-Latn-IT-arevela')).toBe(true);
          });

          it('validates language-region', () => {
            expect(rule.match.test('en-GB')).toBe(true);
          });

          it('validates language-region - three number', () => {
            expect(rule.match.test('es-419')).toBe(true);
          });

          it('validates oed', () => {
            expect(rule.match.test('en-GB-oed')).toBe(true);
          });

          it('invalidates extra white space', () => {
            expect(rule.match.test(' en ')).toBe(false);
          });

          it('invalidates invalid characters', () => {
            expect(rule.match.test('ab-%$')).toBe(false);
          });

          it('invalidates single letter codes', () => {
            expect(rule.match.test('a-DE')).toBe(false);
          });

          it('invalidates too many characters', () => {
            expect(rule.match.test('abcd-nn')).toBe(false);
          });
        });
      },
    ],
    [
      "list-id",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('no datalist found');
        });

        it('does not add an error if an input is linked to a valid datalist', when(() => {
          const id = uniqueId();
          appendToBody(`<input list="${id}"><datalist id="${id}"><datalist />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if the list attribute is empty', when(() => {
          el = appendToBody('<input list>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if the list is missing', when(() => {
          const id = uniqueId();
          el = appendToBody(`<input list="${id}">`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not blow up if the id is invalid', when(() => {
          el = appendToBody('<input list="&quot; \\">');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "no-button-without-type",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('all buttons should have a type attribute');
        });

        it('does not generate an error message with a type attribute', when(() => {
          appendToBody('<button type="button" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('generates an error message without a type attribute', when(() => {
          el = appendToBody('<button />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "no-duplicate-anchor-names",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Name is not unique');
        });

        it('adds an error if a name is empty', when(() => {
          el = appendToBody('<a name />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('adds an error if a name is not unique', when(() => {
          const id = uniqueId();
          el = appendToBody(`<a name="${id}" />`);
          el2 = appendToBody(`<a name="${id}" />`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el], [rule, el2]);
        }));

        it('does not add an error if name is unique', when(() => {
          appendToBody(`<a name="${uniqueId()}" />`);
          appendToBody(`<a name="${uniqueId()}" />`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a name is shared by an id', when(() => {
          const id = uniqueId();
          el = appendToBody(`<a name="${id}" />`);
          appendToBody(`<a id="${id}" />`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not blow up if the name requires escaping', when(() => {
          appendToBody('<a name="&quot; \\" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-empty-select",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Selects should have options');
        });

        it('adds an error if a select has no options', when(() => {
          el = appendToBody('<select />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not add an error if a select has options', when(() => {
          appendToBody('<select><option></select>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-links-to-missing-fragments",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Fragment not found in document');
        });

        it('it does not add an error for a link without a hash', when(() => {
          appendToBody('<a href="path" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('it does not add an error if a link to a hash points to a valid id', when(() => {
          const id = uniqueId();
          appendToBody(`<p id="${id}">p</p><a href="#${id}">link</a>`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('it does not add an error if a link to a hash points to a valid anchor name', when(() => {
          const id = uniqueId();
          appendToBody(`<a name="${id}">p</p><a href="#${id}">link</a>`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('it does not add an error if link with a hash points to another location', when(() => {
          const id = uniqueId();
          appendToBody(`<a href="other#${id}">link</a>`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('it does not add an error if a page with a base and a link with a hash points to another location', when(() => {
          const id = uniqueId();
          $('<base href="http://www.example.com" />').appendTo('head');
          appendToBody(`<a href="#${id}">link</a>`);
        }).then(() => {
          expect(logger).toNotHaveEntries();
          $('base').remove();
        }));

        it('it adds an error if link with a hash has no valid target on the page', when(() => {
          const id = uniqueId();
          el = appendToBody(`<a href="#${id}">link</a>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('it adds an error if link with a path and hash has no valid target on the page', when(() => {
          const id = uniqueId();
          el = appendToBody(`<a href="${location.pathname}#${id}">link</a>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('it adds an error if an absolute link with a hash has no valid target on the page', when(() => {
          const id = uniqueId();
          el = appendToBody(`<a href="${location.href}#${id}">link</a>`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('it adds an error if a page with a base and a link with a hash has no valid target on the page', when(() => {
          const pathParts = location.pathname.split('/');
          $(`<base href="${pathParts.slice(0, -2).join('/')}" />`).appendTo('head');
          const id = uniqueId();
          el = appendToBody(`<a href="${pathParts.slice(-3).join('/')}#${id}">link</a>`);
        }).then(() => {
          $('base').remove();
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not blow up if the hash requires css escaping', when(() => {
          el = appendToBody('<a href="#%22 %5c">link</a>');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));
      },
    ],
    [
      "no-multiple-select",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Do not use multiple selects');
        });

        it('adds an error if a multiple select is used', when(() => {
          el = appendToBody('<select multiple />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not add an error if an normal select is used', when(() => {
          appendToBody('<select />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "no-outside-controls",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('All controls should be within a form');
        });

        ['input', 'textarea', 'select'].forEach((type) => {
          it(`adds an error if a ${type} is outside a form`, when(() => {
            el = appendToBody(`<${type} />`);
          }).then(() => {
            expect(logger).toHaveEntries([rule, el]);
          }));

          it(`does not adds an error if a ${type} is inside a form`, when(() => {
            appendToBody(`<form><${type} /></form>`);
          }).then(() => {
            expect(logger).toNotHaveEntries();
          }));
        });
      },
    ],
    [
      "no-reset",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('Do not use reset buttons');
        });

        it('adds an error if a reset input is used', when(() => {
          el = appendToBody('<input type="reset">');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not add an error if an input is used', when(() => {
          appendToBody('<input>');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));

        it('adds an error if a reset button is used', when(() => {
          el = appendToBody('<button type="reset" />');
        }).then(() => {
          expect(logger).toHaveEntries([rule, el]);
        }));

        it('does not add an error if a button is used', when(() => {
          appendToBody('<button />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "title",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('document must have a title');
        });

        it('it adds an error if the document has an empty title', () => {
          linter.run(document);
          expect(logger).toHaveEntries([rule, $('html')[0]]);
        });

        it('it does not add an error if the document has a title', when(() => {
          document.title = 'title';
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
    [
      "unique-id",
      function() {
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        it('generates the expected error message', () => {
          expect(rule).toGenerateErrorMessage('id is not unique');
        });

        it('adds an error if an id is not unique', when(() => {
          const id = uniqueId();
          el = appendToBody(`<div id="${id}" />`);
          el2 = appendToBody(`<div id="${id}" />`);
        }).then(() => {
          expect(logger).toHaveEntries([rule, el], [rule, el2]);
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

        it('does not blow up if an id required escaping', when(() => {
          appendToBody('<div id="&quot; \\" />');
        }).then(() => {
          expect(logger).toNotHaveEntries();
        }));
      },
    ],
  ]);
}());