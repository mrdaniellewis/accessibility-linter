describe('#elements', () => {
  const unsupported = [
    'dialog',
    'details',
    'summary',
    'menu',
    'menuitem',
  ].sort();

  let elements;
  beforeEach(() => {
    elements = new AccessibilityLinter.Config().elements;
  });

  it('is a property of config', () => {
    expect(elements).toExist();
  });

  it('allows elements to be removed', () => {
    const config = new AccessibilityLinter.Config({ elements: { a: null } });
    expect(config.elements.a).toNotExist();
  });

  it('allows elements to be added', () => {
    const foo = {};
    const config = new AccessibilityLinter.Config({ elements: { foo } });
    expect(config.elements.foo).toEqual(foo);
  });

  it('allows elements to be updated', () => {
    const config = new AccessibilityLinter.Config({ elements: { a: { obsolete: true } } });
    expect(config.elements.a.obsolete).toEqual(true);
  });

  it('contains all elements', () => {
    expect(Object.keys(elements).sort())
      .toMatchArray(testData.allElements.concat(testData.obsoleteElements).sort());
  });

  it('contains all obsolete elements', () => {
    expect(Object.keys(elements).filter(name => elements[name].obsolete).sort())
      .toMatchArray(testData.obsoleteElements);
  });

  it('contains unsupported elements', () => {
    expect(Object.keys(elements).filter(name => elements[name].unsupported === true).sort())
      .toMatchArray(unsupported);
  });

  describe('native text alternatives', () => {
    const hasNativeLabel = ['area', 'button', 'details', 'fieldset', 'img', 'input', 'meter', 'output', 'progress', 'select', 'textarea'];
    const hasNativeDescription = [];

    describe('elements have no native label', () => {
      testData.allElements.filter(name => !hasNativeLabel.includes(name)).forEach((name) => {
        it(`<${name}>`, () => {
          expect(elements[name].nativeLabel).toEqual(undefined);
        });
      });
    });

    describe('elements have no native description', () => {
      testData.allElements.filter(name => !hasNativeDescription.includes(name)).forEach((name) => {
        it(`<${name}>`, () => {
          expect(elements[name].nativeDescription).toEqual(undefined);
        });
      });
    });

    describe('elements with a native label', () => {
      let utils;
      clean();

      beforeEach(() => {
        utils = new AccessibilityLinter.Utils();
      });

      ['img', 'area'].forEach((name) => {
        describe(`<${name}>`, () => {
          it('uses the alt attribute as text alternative', () => {
            const el = appendToBody(`<${name} alt="foo" />`);
            expect(elements[name].nativeLabel(el, utils)).toEqual('foo');
          });

          it('it defaults to an empty string', () => {
            const el = appendToBody(`<${name} />`);
            expect(elements[name].nativeLabel(el, utils)).toEqual('');
          });
        });
      });

      const testLabels = (name, attrs = '') => {
        it('uses label elements associated with the control by the "for" attribute', () => {
          const id = uniqueId();
          const label1 = appendToBody(`<label for="${id}">foo</label>`);
          const label2 = appendToBody(`<label for="${id}">foo</label>`);
          const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
          expect(elements[name].nativeLabel(el, utils)).toEqual([label1, label2]);
        });

        it('uses an ancestor label without the "for" attribute', () => {
          const label = appendToBody(`<label><${name} ${attrs}></${name}>foo</label>`);
          expect(elements[name].nativeLabel(label.querySelector(name), utils)).toEqual([label]);
        });

        it('does not use an ancestor label with the "for" attribute', () => {
          const id = uniqueId();
          const label = appendToBody(`<label for="${id}"><${name} ${attrs}></${name}>foo</label>`);
          expect(elements[name].nativeLabel(label.querySelector(name), utils)).toEqual([]);
        });

        it('uses for associated labels and ancestor labels', () => {
          const id = uniqueId();
          const label1 = appendToBody(`<label for="${id}">foo</label>`);
          const label2 = appendToBody(`<label for="${id}">foo</label>`);
          const label3 = appendToBody(`<label><${name} id="${id}" ${attrs}></${name}>fee</label>`);
          expect(elements[name].nativeLabel(label3.querySelector(name), utils))
            .toEqual([label1, label2, label3]);
        });

        it('associates labels with the first control with the id', () => {
          const id = uniqueId();
          appendToBody(`<label for="${id}">foo</label>`);
          appendToBody(`<${name} id="${id}"></${name}>`);
          const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
          expect(elements[name].nativeLabel(el, utils)).toEqual([]);
        });

        it('does not use hidden labels', () => {
          const id = uniqueId();
          appendToBody(`<label for="${id}" aria-hidden="true">foo</label>`);
          const el = appendToBody(`<${name} id="${id}"></${name}>`);
          expect(elements[name].nativeLabel(el, utils)).toEqual([]);
        });
      };

      ['button', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
        describe(`<${name}>`, () => {
          testLabels(name);
        });
      });

      describe('<input[type=hidden]>', () => {
        it('has no nativeLabel', () => {
          const label = appendToBody('<label><input type="hidden" alt="xx">foo</label>');
          expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual(null);
        });
      });

      ['submit', 'reset', 'button'].forEach((type) => {
        describe(`<input[type=${type}]>`, () => {
          it('uses value as the native label', () => {
            const label = appendToBody(`<label><input type="${type}" value="bar">foo</label>`);
            expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual('bar');
          });
        });
      });

      describe('<input[type=image]>', () => {
        it('uses the alt text as a native label', () => {
          const label = appendToBody('<label><input type="image" alt="bar">foo</label>');
          expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual('bar');
        });

        it('uses the value text as a native label if there is no alt', () => {
          const label = appendToBody('<label><input type="image" value="bar">foo</label>');
          expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual('bar');
        });
      });

      describe('<input> with no type', () => {
        testLabels('input', 'alt="xxx"');
      });

      describe('<input> with a type', () => {
        // No need to test every type
        testLabels('input', 'type="email" alt="xxx"');
      });

      describe('<fieldset>', () => {
        it('uses the first legend as the native text alternative', () => {
          const el = appendToBody(`<fieldset>
            <legend>foo</legend>
            <legend>bar</legend>
            <p>foe thumb</p>
          </fieldset>`);
          expect(elements.fieldset.nativeLabel(el, utils)).toEqual(el.querySelector('legend'));
        });

        it('returns null if the legend is hidden', () => {
          const el = appendToBody(`<fieldset>
            <legend aria-hidden="true">foo</legend>
            <legend>bar</legend>
            <p>foe thumb</p>
          </fieldset>`);
          expect(elements.fieldset.nativeLabel(el, utils)).toEqual(null);
        });
      });

      describe('<details>', () => {
        it('uses the first summary as the native text alternative', () => {
          const el = appendToBody(`<details>
            <summary>foo</summary>
            <summary>bar</summary>
            <p>foe thumb</p>
          </details>`);
          expect(elements.details.nativeLabel(el, utils)).toEqual(el.querySelector('summary'));
        });

        it('returns null if the legend is hidden', () => {
          const el = appendToBody(`<details>
            <summary aria-hidden="true">foo</summary>
            <summary>bar</summary>
            <p>foe thumb</p>
          </details>`);
          expect(elements.details.nativeLabel(el, utils)).toEqual(null);
        });
      });
    });
  });
});
