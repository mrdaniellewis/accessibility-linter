describe('utils', () => {
  const utils = AccessibilityLinter.utils;

  it('is a property of AccessibilityLinter', () => {
    expect(utils).toExist();
  });

  describe('#$$', () => {
    clean();

    it('returns an empty array if nothing is found', () => {
      expect(utils.$$('foo')).toEqual([]);
    });

    context('without a context', () => {
      it('finds elements matching the selector as an array', () => {
        const foo = appendToBody('<foo />');
        const bar = appendToBody('<bar />');

        expect(utils.$$('foo, bar')).toEqual([foo, bar]);
      });
    });

    context('with a context', () => {
      it('finds within in the context matching the selector as an array', () => {
        appendToBody('<foo />');
        const context = appendToBody('<div><foo /><bar /></div>');
        const foo = context.querySelector('foo');
        const bar = context.querySelector('bar');
        expect(utils.$$('foo, bar', context)).toEqual([foo, bar]);
      });

      it('includes the context if it matches the selector', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const bar = foo.querySelector('bar');
        expect(utils.$$('foo, bar', foo)).toEqual([foo, bar]);
      });
    });
  });

  describe('#$', () => {
    clean();

    it('returns undefined if nothing is found', () => {
      expect(utils.$('foo')).toEqual(undefined);
    });

    context('without a context', () => {
      it('finds the first element matching the selector', () => {
        const foo = appendToBody('<foo />');
        appendToBody('<bar />');

        expect(utils.$('foo, bar')).toEqual(foo);
      });
    });

    context('with a context', () => {
      it('finds the first element matching the selector within the context', () => {
        appendToBody('<foo />');
        const context = appendToBody('<div><foo /><bar /></div>');
        const foo = context.querySelector('foo');
        context.querySelector('bar');
        expect(utils.$('foo, bar', context)).toEqual(foo);
      });
    });
  });

  describe('#cssEscape', () => {
    it('escapes a string so it can be included in a css string', () => {
      expect(utils.cssEscape('foo"bar\\')).toEqual('foo\\"bar\\\\');
    });
  });

  describe('#hidden', () => {
    clean();

    it('is false for elements that are not hidden', () => {
      const el = appendToBody('<div>x</div>');
      expect(utils.hidden(el)).toEqual(false);
    });

    it('is true for elements that have aria-hidden=true', () => {
      const el = appendToBody('<div aria-hidden="true">x</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('is true for elements that have a parent set to aria-hidden=true', () => {
      const el = appendToBody('<div aria-hidden="true"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('is true for elements that are display: none', () => {
      const el = appendToBody('<div style="display: none">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('is true for elements that have a parent set to display: none', () => {
      const el = appendToBody('<div style="display: none"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('is true for elements that are visibility: hidden', () => {
      const el = appendToBody('<div style="visibility: hidden">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('is true for elements that have a parent set to visibility: hidden', () => {
      const el = appendToBody('<div style="visibility: hidden"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('is true for elements that are visibility: collapse', () => {
      const el = appendToBody('<div style="visibility: collapse">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('is true for elements that have a parent set to visibility: collapse', () => {
      const el = appendToBody('<div style="visibility: collapse"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    describe('style option', () => {
      it('accepts a computed style', () => {
        const el = appendToBody('<div style="display: none">foo</div>');
        const style = window.getComputedStyle(el);
        const spy = expect.spyOn(window, 'getComputedStyle');
        expect(utils.hidden(el, { style })).toEqual(true);
        expect(spy).toNotHaveBeenCalled();
        spy.restore();
      });
    });

    describe('noAria option', () => {
      it('ignores an aria-hidden element if true', () => {
        const el = appendToBody('<div aria-hidden="true">foo</div>');
        expect(utils.hidden(el, { noAria: true })).toEqual(false);
      });

      it('does not ignore a aria-hidden element if false', () => {
        const el = appendToBody('<div aria-hidden="true">foo</div>');
        expect(utils.hidden(el, { noAria: false })).toEqual(true);
      });
    });
  });

  describe('text alternatives', () => {
    clean();

    proxy(fn => fn(AccessibilityLinter.config, 'elements', {
      'native-text': {
        nativeLabel(el) {
          return el.getAttribute('data-alt') || null;
        },

        nativeDescription(el) {
          return el.getAttribute('data-description') || null;
        },
      },
      'native-elements': {
        nativeLabel(el) {
          return (el.getAttribute('data-alt') || '')
            .split(/\s+/)
            .map(id => document.getElementById(id));
        },

        nativeDescription(el) {
          return (el.getAttribute('data-description') || '')
            .split(/\s+/)
            .map(id => document.getElementById(id));
        },
      },
    }));

    describe('#accessibleName', () => {
      it('returns an empty string for hidden elements', () => {
        const el = appendToBody('<div aria-hidden="true" />');
        expect(utils.accessibleName(el)).toEqual('');
      });

      describe('labelledby', () => {
        it('returns the labelledby name', () => {
          const id = uniqueId();
          appendToBody(`<button id="${id}">foo</button>`);
          const el = appendToBody(`<div aria-labelledby="${id}" />`);
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('returns multiple labelledby names separated by spaces in id-list order', () => {
          const id = uniqueId();
          const id2 = uniqueId();
          appendToBody(`<button id="${id}">foo</button>`);
          appendToBody(`<button id="${id2}">bar</button>`);
          const el = appendToBody(`<div aria-labelledby="${id2} ${id}" />`);
          expect(utils.accessibleName(el)).toEqual('bar foo');
        });

        it('returns names of hidden elements', () => {
          const id = uniqueId();
          appendToBody(`<button aria-hidden="true" id="${id}">foo</button>`);
          const el = appendToBody(`<div aria-labelledby="${id}" />`);
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('does not resolve recursively resolve labelledby attributes', () => {
          const id = uniqueId();
          const id2 = uniqueId();
          appendToBody(`<button id="${id}" aria-labelledby="${id2}">foo</button>`);
          appendToBody(`<button id="${id2}">bar</button>`);
          const el = appendToBody(`<div aria-labelledby="${id}" />`);
          expect(utils.accessibleName(el)).toEqual('foo');
        });
      });

      describe('aria-label', () => {
        it('returns a non-empty aria-label', () => {
          const el = appendToBody('<div aria-label="foo" />');
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('returns aria-labelledby in preference to aria-label', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <div aria-label="bar" aria-labelledby="${id}" />
            <div id="${id}">foo</div>
          `);
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('returns aria-label if aria-laballedby is empty', () => {
          const el = appendToBody('<div aria-label="foo" aria-labelledby="" />');
          expect(utils.accessibleName(el)).toEqual('foo');
        });
      });

      describe('native text alternative', () => {
        it('ignores the native text alternative if role="none"', () => {
          const el = appendToBody('<native-text data-alt="alt" role="none" />');
          expect(utils.accessibleName(el)).toEqual('');
        });

        it('ignores the native text alternative if role="presentation"', () => {
          const el = appendToBody('<native-text data-alt="alt" role="presentation" />');
          expect(utils.accessibleName(el)).toEqual('');
        });

        context('native label returns text', () => {
          it('returns the native label of an element', () => {
            const el = appendToBody('<native-text data-alt="alt" />');
            expect(utils.accessibleName(el)).toEqual('alt');
          });
        });

        context('native label returns elements', () => {
          it('returns the names of an elements', () => {
            const id1 = uniqueId();
            const id2 = uniqueId();
            const el = appendToBody(`
              <native-elements data-alt="${id1} ${id2}" />
              <span id="${id2}">bar</span>
              <span id="${id1}">foo</span>
            `);

            expect(utils.accessibleName(el)).toEqual('foo bar');
          });

          it('does include hidden elements', () => {
            const id = uniqueId();
            const el = appendToBody(`
              <native-elements data-alt="${id}" />
              <span id="${id}" aria-hidden="true">foo</span>
            `);

            expect(utils.accessibleName(el)).toEqual('foo');
          });

          it('does not create infinite loops', () => {
            const id = uniqueId();
            const el = appendToBody(`<span id="${id}"><native-elements data-alt="${id}" />foo</span>`);

            expect(utils.accessibleName(el.querySelector('native-elements'))).toEqual('foo');
          });
        });

        context('precedence', () => {
          it('returns aria-label in preference to native text alternative', () => {
            const el = appendToBody('<native-text data-alt="alt" aria-label="foo" />');
            expect(utils.accessibleName(el)).toEqual('foo');
          });

          it('returns the native text alternative if aria-label is empty', () => {
            const el = appendToBody('<native-text data-alt="alt" aria-label="" />');
            expect(utils.accessibleName(el)).toEqual('alt');
          });
        });
      });

      describe('name from contents', () => {
        it('returns contents from text nodes for elements allowing name from contents', () => {
          const el = appendToBody('<div role="button">bar</div>');
          expect(utils.accessibleName(el)).toEqual('bar');
        });

        it('does not return contents from text nodes for roles not allowing name from contents', () => {
          const el = appendToBody('<div>bar</div>');
          expect(utils.accessibleName(el)).toEqual('');
        });

        it('recursively finds the name of child elements', () => {
          const el = appendToBody('<div role="button"><div><span>foo</span><span>bar</span></div>');
          expect(utils.accessibleName(el)).toEqual('foobar');
        });

        it('trims additional whitespace', () => {
          const el = appendToBody('<div role="button"> <div>  <span>foo</span><span>bar</span>  <span>fee</span> </div>');
          expect(utils.accessibleName(el)).toEqual('foobar fee');
        });

        it('uses the full algorithm on descendant nodes', () => {
          const el = appendToBody('<div role="button"><div><span aria-label="fee">foo</span></div>');
          expect(utils.accessibleName(el)).toEqual('fee');
        });

        it('does not create infinite loops', () => {
          const id = uniqueId();
          const el = appendToBody(`<div role="button"><div id="${id}">foo<span aria-labelledby="${id}">bar</span></div></div>`);
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('does not recurse hidden elements', () => {
          const el = appendToBody('<div role="button"><div aria-hidden="true">foo</div></div>');
          expect(utils.accessibleName(el)).toEqual('');
        });

        it('does not recurse hidden elements when resolving visible aria-labelledby', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <button aria-labelledby="${id}">foo</button>
            <div id="${id}"><span style="display: none">bar</span></div>
          `);
          expect(utils.accessibleName(el)).toEqual('');
        });

        it('recurses hidden elements when following a labelledby hidden labelledby element', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <button aria-labelledby="${id}">foo</button>
            <div id="${id}" aria-hidden="true"><span style="display: none">bar</span></div>
          `);
          expect(utils.accessibleName(el)).toEqual('bar');
        });

        it('returns native text alternative in preference to DOM contents for text-alternatives', () => {
          const el = appendToBody('<native-text role="button" data-alt="alt">bar</native-text>');
          expect(utils.accessibleName(el)).toEqual('alt');
        });

        it('returns the DOM contents in preference to native text alternative if no text content is found', () => {
          const el = appendToBody('<native-text role="button">bar</native-text>');
          expect(utils.accessibleName(el)).toEqual('bar');
        });

        it('returns the native text alternative in preference to DOM contents for element alternatives', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <native-elements data-alt="${id}" role="button">bar</native-element>
            <span id="${id}">foo</span>
          `);
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        it('returns the DOM contents in preference to native text alternative if no elements are found', () => {
          const id = uniqueId();
          const el = appendToBody(`<native-elements data-alt="${id}" role="button">bar</native-element>`);
          expect(utils.accessibleName(el)).toEqual('bar');
        });

        describe('embedded controls', () => {
          context('when getting a name for a widget', () => {
            it('uses the value of an <input>', () => {
              const el = appendToBody('<div role="button"><input value="foo" /></div>');
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses the value of a <select>', () => {
              const el = appendToBody('<div role="button"><select><option>one</option><option selected>two</option></select></div>');
              expect(utils.accessibleName(el)).toEqual('two');
            });

            it('uses the value of a <select multiple>', () => {
              const el = appendToBody(`<div role="button">
                <select multiple>
                  <option>one</option>
                  <option selected>two</option>
                  <option selected>three</option>
                </select>
              </div>`);
              expect(utils.accessibleName(el)).toEqual('two three');
            });

            it('uses the value of a <textarea>', () => {
              const el = appendToBody('<div role="button"><textarea aria-label="bar">foo</textarea></div>');
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses the value of a widget of type textbox', () => {
              const el = appendToBody('<div role="button"><span role="textbox" aria-label="bar">foo<span></div>');
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses the value of a widget of type searchbox', () => {
              const el = appendToBody('<div role="button"><span role="searchbox" aria-label="bar">foo<span></div>');
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses the value of a widget of type range using aria-valuenow', () => {
              const el = appendToBody('<button><div role="slider" aria-valuemin="0" aria-valuenow="102" aria-valuemax="255"></div></button>');
              expect(utils.accessibleName(el)).toEqual('102');
            });

            it('uses the value of a widget of type range using aria-valuetext', () => {
              const el = appendToBody('<button><div role="slider" aria-valuemin="1" aria-valuenow="5" aria-valuetext="May" aria-valuemax="12"></div></button>');
              expect(utils.accessibleName(el)).toEqual('May');
            });

            it('uses the widget value in preference to aria-label', () => {
              const el = appendToBody('<div role="button"><input value="foo" aria-label="bar" /></div>');
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses the widget value in preference to native label', () => {
              const id = uniqueId();
              const el = appendToBody(`
                <div role="button"><input value="foo" id="${id}" /></div>
                <label for="${id}">bar</label>
              `);
              expect(utils.accessibleName(el)).toEqual('foo');
            });

            it('uses aria-labelledby in preference to the widget value', () => {
              const id = uniqueId();
              const el = appendToBody(`
                <div role="button"><input value="foo" aria-labelledby="${id}" /></div>
                <span id="${id}">bar</span>
              `);
              expect(utils.accessibleName(el)).toEqual('bar');
            });
          });

          context('when getting a name for not a widget', () => {
            it('uses the accessible name of the <input>', () => {
              const el = appendToBody('<div role="heading"><input value="foo" aria-label="bar" /></div>');
              expect(utils.accessibleName(el)).toEqual('bar');
            });
          });
        });
      });

      describe('tooltip', () => {
        it('returns the tooltip', () => {
          const el = appendToBody('<div title="foo"></div>');
          expect(utils.accessibleName(el)).toEqual('foo');
        });

        context('roles allowing name from contents', () => {
          it('returns DOM contents in preference to a tooltip', () => {
            const el = appendToBody('<div role="button" title="foo">bar</div>');
            expect(utils.accessibleName(el)).toEqual('bar');
          });

          it('returns the tooltip if the DOM contents are empty', () => {
            const el = appendToBody('<div role="button" title="foo"></div>');
            expect(utils.accessibleName(el)).toEqual('foo');
          });
        });

        context('roles not allowing name from contents', () => {
          it('returns the tooltip if the element has DOM contents', () => {
            const el = appendToBody('<div title="foo">bar</div>');
            expect(utils.accessibleName(el)).toEqual('foo');
          });

          it('returns the native text alternative in preference to tooltip', () => {
            const el = appendToBody('<native-text data-alt="foo" title="bar">bar</native-text>');
            expect(utils.accessibleName(el)).toEqual('foo');
          });
        });
      });

      describe('flat string', () => {
        it('returns the name as a trimmed flat string', () => {
          const el = appendToBody(`<button>
            <div>
              foo
              <native-text data-alt="bar\nfi  \t\rthumb" />
              <span>fee </span>  <span>foo</span><span>fox</span>
              <div aria-label=" foo " />
              <input value=" frog "/>
            </div>
          </button>`);
          expect(utils.accessibleName(el)).toEqual('foo bar fi thumb fee foofox foo frog');
        });
      });

      describe('specification examples', () => {
        it('passes nested labelledby traversal example', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const id3 = uniqueId();
          const el1 = appendToBody(`<element1 id="${id1}" aria-labelledby="${id3}" />`);
          const el2 = appendToBody(`<element2 id="${id2}" aria-labelledby="${id1}" />`);
          appendToBody(`<element3 id="${id3}">hello</element3>`);
          expect(utils.accessibleName(el1)).toEqual('hello');
          expect(utils.accessibleName(el2)).toEqual('');
        });

        it('passes aria-labelledby referring to itself example', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <span role="button" id="${id1}" aria-label="Delete" aria-labelledby="${id1} ${id2}"></span>
            <a id="${id2}" href="./files/Documentation.pdf">Documentation.pdf</a>
          `);
          expect(utils.accessibleName(el)).toEqual('Delete Documentation.pdf');
        });

        it('passes the embedded control example', () => {
          const el = appendToBody('<div role="checkbox" aria-checked="false">Flash the screen <span role="textbox" aria-multiline="false"> 5 </span> times</div>');
          expect(utils.accessibleName(el)).toEqual('Flash the screen 5 times');
        });
      });
    });

    describe('#accessibleDescription', () => {
      context('aria-describedby', () => {
        it('returns an empty string for elements by no ariadescribedby attribute', () => {
          const el = appendToBody('<button>foo</button>');
          expect(utils.accessibleDescription(el)).toEqual('');
        });

        it('returns an empty string for hidden elements', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <div aria-hidden="true" aria-describedby="${id}" />')
            <div id="${id}">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('');
        });

        it('returns the name of the referenced aria-describedby elements in attribute order', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <div aria-describedby="${id1} ${id2}" />')
            <div id="${id2}">bar</div>
            <div id="${id1}">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('foo bar');
        });
      });

      context('native description', () => {
        it('returns a text native description', () => {
          const el = appendToBody('<native-text data-description="foo">bar</button>');
          expect(utils.accessibleDescription(el)).toEqual('foo');
        });

        it('ignores an null native text description', () => {
          const el = appendToBody('<native-text>bar</native-text>');
          expect(utils.accessibleDescription(el)).toEqual('');
        });

        it('returns an element native description', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <native-elements data-description="${id1} ${id2}" />')
            <div id="${id2}">bar</div>
            <div id="${id1}">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('foo bar');
        });

        it('ignores an missing element referenced from a native text description', () => {
          const id = uniqueId();
          const el = appendToBody(`<div data-description="${id}" />')`);
          expect(utils.accessibleDescription(el)).toEqual('');
        });

        it('returns aria-describedby in preference to a native description', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <native-elements data-description="${id1}" aria-describedby="${id2}" />')
            <div id="${id2}">bar</div>
            <div id="${id1}">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('bar');
        });
      });

      context('rescuring', () => {
        it('does not return name using aria-labelledby', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <div aria-labelledby="${id}" />')
            <div id="${id}">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('');
        });

        it('returns the described from referenced elements that are hidden', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <div aria-describedby="${id}" />')
            <div id="${id}" aria-hidden="true">foo</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('foo');
        });

        it('does not follow multiple aria-describedby attributes', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <div aria-describedby="${id1}" />')
            <div id="${id1}" aria-describedby="${id2}">foo</div>
            <div id="${id2}">bar</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('foo');
        });

        it('follows aria-labelledby attributes on referenced elements', () => {
          const id1 = uniqueId();
          const id2 = uniqueId();
          const el = appendToBody(`
            <div aria-describedby="${id1}" />')
            <div id="${id1}" aria-labelledby="${id2}">foo</div>
            <div id="${id2}">bar</div>
          `);
          expect(utils.accessibleDescription(el)).toEqual('bar');
        });

        it('does not return the native description when recursing', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <div aria-describedby="${id}" />')
            <native-text id="${id}" data-description="foo">bar</native-text>
          `);
          expect(utils.accessibleDescription(el)).toEqual('bar');
        });
      });

      describe('flat string', () => {
        it('returns the description as a trimmed flat string', () => {
          const id = uniqueId();
          const el = appendToBody(`
            <button aria-describedby="${id}">button</button>
            <div id="${id}">
              foo
              <native-text data-alt="bar\nfi  \t\rthumb" />
              <span>fee </span>  <span>foo</span><span>fox</span>
              <div aria-label=" foo " />
              <input value=" frog "/>
            </div>
          </button>`);
          expect(utils.accessibleDescription(el)).toEqual('foo bar fi thumb fee foofox foo frog');
        });
      });
    });
  });

  describe('#aria', () => {
    const aria = utils.aria;
    clean();

    it('is a property of utils', () => {
      expect(aria).toExist();
    });

    describe('#allowed', () => {
      describe('it has the expected return for', () => {
        it('an unknown element', () => {
          const el = build('<frank />');
          expect(aria.allowed(el)).toInclude({
            roles: '*',
            implicit: [],
          });
        });

        it('a element with a href', () => {
          const el = build('<a href="#" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['link'],
            roles: [
              'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
              'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
            ],
          });
        });

        it('a element without a href', () => {
          const el = build('<a />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('address', () => {
          const el = build('<address />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['contentinfo'],
            roles: [],
          });
        });

        it('area element with a href', () => {
          const el = build('<area href="#" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['link'],
            roles: [],
          });
        });

        it('article', () => {
          const el = build('<article />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['article'],
            roles: ['presentation', 'document', 'application', 'main', 'region'],
          });
        });

        it('aside', () => {
          const el = build('<aside />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['complementary'],
            roles: ['note', 'region', 'search'],
          });
        });

        it('audio', () => {
          const el = build('<audio />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application'],
          });
        });

        it('base', () => {
          const el = build('<base />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('body', () => {
          const el = build('<body />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['document'],
            roles: [],
          });
        });

        it('button', () => {
          const el = build('<button />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: ['checkbox', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
          });
        });

        it('button type="menu"', () => {
          const el = build('<button type="menu" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
          });
        });

        it('caption', () => {
          const el = build('<caption />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('col', () => {
          const el = build('<col />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('colgroup', () => {
          const el = build('<colgroup />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('data', () => {
          const el = build('<data />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('datalist', () => {
          const el = build('<datalist />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['listbox'],
            roles: [],
          });
        });

        it('dd', () => {
          const el = build('<dd />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['definition'],
            roles: [],
          });
        });

        it('details', () => {
          const el = build('<details />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['group'],
            roles: [],
          });
        });

        it('dialog', () => {
          const el = build('<dialog />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['dialog'],
            roles: ['alertdialog'],
          });
        });

        it('div', () => {
          const el = build('<div />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('dl', () => {
          const el = build('<dl />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['list'],
            roles: ['group', 'presentation'],
          });
        });

        it('dt', () => {
          const el = build('<dt />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['listitem'],
            roles: [],
          });
        });

        it('embed', () => {
          const el = build('<embed />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application', 'document', 'presentation', 'img'],
          });
        });

        it('fieldset', () => {
          const el = build('<fieldset />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['group', 'presentation'],
          });
        });

        it('figcaption', () => {
          const el = build('<figcaption />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['group', 'presentation'],
          });
        });

        it('figure', () => {
          const el = build('<figure />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['figure'],
            roles: ['group', 'presentation'],
          });
        });

        it('footer descendant of article or section', () => {
          const el = $('<article><footer /></article>').find('footer')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['group', 'presentation'],
          });
        });

        it('footer', () => {
          const el = build('<footer />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['contentinfo'],
            roles: ['group', 'presentation'],
          });
        });

        it('form', () => {
          const el = build('<form />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['form'],
            roles: ['search', 'presentation'],
          });
        });

        it('p', () => {
          const el = build('<p />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('pre', () => {
          const el = build('<pre />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('blockquote', () => {
          const el = build('<blockquote />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('h1', () => {
          const el = build('<h1 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('h2', () => {
          const el = build('<h2 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('h3', () => {
          const el = build('<h3 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('h4', () => {
          const el = build('<h4 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('h5', () => {
          const el = build('<h5 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('h6', () => {
          const el = build('<h6 />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['heading'],
            roles: ['tab', 'presentation'],
          });
        });

        it('head', () => {
          const el = build('<head />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('header descendant of article or section', () => {
          const el = $('<article><header /></article>').find('header')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['group', 'presentation'],
          });
        });

        it('header', () => {
          const el = build('<header />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['banner'],
            roles: ['group', 'presentation'],
          });
        });

        it('hr', () => {
          const el = build('<hr />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['separator'],
            roles: ['presentation'],
          });
        });

        it('html', () => {
          const el = build('<html />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('iframe', () => {
          const el = build('<iframe />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application', 'document', 'img'],
          });
        });

        it('img with alt=""', () => {
          const el = build('<img alt="" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['presentation'],
          });
        });

        it('img', () => {
          const el = build('<img />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['img'],
            roles: '*',
          });
        });

        it('input type="button"', () => {
          const el = build('<input type="button" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
          });
        });

        it('input type="checkbox"', () => {
          const el = build('<input type="checkbox" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['checkbox'],
            roles: ['button', 'menuitemcheckbox', 'switch'],
          });
        });

        it('input type="color"', () => {
          const el = build('<input type="color" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="date"', () => {
          const el = build('<input type="date" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="datetime"', () => {
          const el = build('<input type="datetime" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="datetime-local"', () => {
          const el = build('<input type="datetime-local" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="list" without list attribute', () => {
          const el = build('<input type="email" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('input type="file"', () => {
          const el = build('<input type="file" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="hidden"', () => {
          const el = build('<input type="hidden" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="image"', () => {
          const el = build('<input type="image" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
          });
        });

        it('input type="month"', () => {
          const el = build('<input type="month" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="number"', () => {
          const el = build('<input type="number" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['spinbutton'],
            roles: [],
          });
        });

        it('input type="password"', () => {
          const el = build('<input type="password" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('input type="radio"', () => {
          const el = build('<input type="radio" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['radio'],
            roles: ['menuitemradio'],
          });
        });

        it('input type="range"', () => {
          const el = build('<input type="range" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['slider'],
            roles: [],
          });
        });

        it('input type="reset"', () => {
          const el = build('<input type="reset" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: [],
          });
        });

        it('input type="search" with no list attribute', () => {
          const el = build('<input type="search" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['searchbox'],
            roles: [],
          });
        });

        it('input type="submit"', () => {
          const el = build('<input type="submit" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: [],
          });
        });

        it('input type="tel" with no list attribute', () => {
          const el = build('<input type="tel" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('input type="text" with no list attribute', () => {
          const el = build('<input type="text" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('input type="text" with a list attribute', () => {
          const el = build('<input type="text" list="list" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['combobox'],
            roles: [],
          });
        });

        it('input type="search" with a list attribute', () => {
          const el = build('<input type="search" list="list" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['combobox'],
            roles: [],
          });
        });

        it('input type="tel" with a list attribute', () => {
          const el = build('<input type="tel" list="list" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['combobox'],
            roles: [],
          });
        });

        it('input type="url" with a list attribute', () => {
          const el = build('<input type="url" list="list" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['combobox'],
            roles: [],
          });
        });

        it('input type="email" with a list attribute', () => {
          const el = build('<input type="email" list="list" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['combobox'],
            roles: [],
          });
        });

        it('input type="time"', () => {
          const el = build('<input type="time" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('input type="url" with no list attribute', () => {
          const el = build('<input type="url" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('input type="week"', () => {
          const el = build('<input type="week" />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('ins', () => {
          const el = build('<ins />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('del', () => {
          const el = build('<del />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('label', () => {
          const el = build('<label />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('legend', () => {
          const el = build('<legend />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('li whose parent is an ol', () => {
          const el = $('<ol><li /></ol>').find('li')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: ['listitem'],
            roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
          });
        });

        it('li whose parent is a ul', () => {
          const el = $('<ul><li /></ul>').find('li')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: ['listitem'],
            roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
          });
        });

        it('link with a href', () => {
          const el = build('<link href="#" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['link'],
            roles: [],
          });
        });

        it('main', () => {
          const el = build('<main />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['main'],
            roles: [],
          });
        });

        it('map', () => {
          const el = build('<map />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('math', () => {
          const el = build('<math />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['math'],
            roles: [],
          });
        });

        it('menu type="toolbar"', () => {
          const el = build('<menu type="toolbar" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['toolbar'],
            roles: [],
          });
        });

        it('menuitem type="command"', () => {
          const el = build('<menuitem type="command" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['menuitem'],
            roles: [],
          });
        });

        it('menuitem type="checkbox"', () => {
          const el = build('<menuitem type="checkbox" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['menuitemcheckbox'],
            roles: [],
          });
        });

        it('menuitem type="radio"', () => {
          const el = build('<menuitem type="radio" />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['menuitemradio'],
            roles: [],
          });
        });

        it('meta', () => {
          const el = build('<meta />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('meter', () => {
          const el = build('<meter />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['progressbar'],
            roles: [],
          });
        });

        it('nav', () => {
          const el = build('<nav />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['navigation'],
            roles: [],
          });
        });

        it('noscript', () => {
          const el = build('<noscript />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('object', () => {
          const el = build('<object />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application', 'document', 'img'],
          });
        });

        it('ol', () => {
          const el = build('<ol />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['list'],
            roles: ['directory', 'group', 'listbox', 'menu', 'menubar', 'presentation', 'radiogroup', 'tablist', 'toolbar', 'tree'],
          });
        });

        it('optgroup', () => {
          const el = build('<optgroup />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['group'],
            roles: [],
          });
        });

        it('option within a list of options', () => {
          const el = $('<select><option /></select>').find('option')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: ['option'],
            roles: [],
          });
        });

        it('option within a list of options in an optgroup', () => {
          const el = $('<select><optgroup><option /></optgroup></select>').find('option')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: ['option'],
            roles: [],
          });
        });

        it('option within a datalist', () => {
          const el = $('<datalist><option /></datalist>').find('option')[0];
          expect(aria.allowed(el)).toInclude({
            implicit: ['option'],
            roles: [],
          });
        });

        it('option on its own', () => {
          const el = build('<option />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('output', () => {
          const el = build('<output />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['status'],
            roles: '*',
          });
        });

        it('param', () => {
          const el = build('<param />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('picture', () => {
          const el = build('<picture />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('progress', () => {
          const el = build('<progress />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['progressbar'],
            roles: [],
          });
        });

        it('script', () => {
          const el = build('<script />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('section', () => {
          const el = build('<section />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['region'],
            roles: [
              'alert', 'alertdialog', 'application', 'banner', 'complementary', 'contentinfo',
              'dialog', 'document', 'log', 'main', 'marquee', 'navigation', 'search', 'status',
            ],
          });
        });

        it('select', () => {
          const el = build('<select />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['listbox'],
            roles: [],
          });
        });

        it('source', () => {
          const el = build('<source />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('span', () => {
          const el = build('<span />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });

        it('style', () => {
          const el = build('<style />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('svg', () => {
          const el = build('<svg />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application', 'document', 'img'],
          });
        });

        it('summary', () => {
          const el = build('<summary />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['button'],
            roles: [],
          });
        });

        it('table', () => {
          const el = build('<table />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['table'],
            roles: '*',
          });
        });

        it('template', () => {
          const el = build('<template />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('textarea', () => {
          const el = build('<textarea />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['textbox'],
            roles: [],
          });
        });

        it('tbody', () => {
          const el = build('<tbody />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['rowgroup'],
            roles: '*',
          });
        });

        it('thead', () => {
          const el = build('<thead />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['rowgroup'],
            roles: '*',
          });
        });

        it('tfoot', () => {
          const el = build('<tfoot />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['rowgroup'],
            roles: '*',
          });
        });

        it('title', () => {
          const el = build('<title />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('td', () => {
          const el = build('<td />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['cell'],
            roles: '*',
          });
        });

        [
          'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'time',
          'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark',
          'ruby', 'rc', 'rtc', 'rt', 'rp', 'bdi', 'bdo', 'br', 'wbr',
        ].forEach((name) => {
          it(name, () => {
            const el = build(`<${name} />`);
            expect(aria.allowed(el)).toInclude({
              implicit: [],
              roles: '*',
            });
          });
        });

        it('th', () => {
          const el = build('<th />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['columnheader', 'rowheader'],
            roles: '*',
          });
        });

        it('tr', () => {
          const el = build('<tr />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['row'],
            roles: '*',
          });
        });

        it('track', () => {
          const el = build('<track />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: [],
          });
        });

        it('ul', () => {
          const el = build('<ul />');
          expect(aria.allowed(el)).toInclude({
            implicit: ['list'],
            roles: [
              'directory', 'group', 'listbox', 'menu', 'menubar', 'tablist',
              'toolbar', 'tree', 'presentation',
            ],
          });
        });

        it('video', () => {
          const el = build('<video />');
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: ['application'],
          });
        });
      });
    });

    describe('#getRole', () => {
      it('returns null for no role', () => {
        const el = build('<div />');
        expect(aria.getRole(el)).toEqual(null);
      });

      it('returns a valid provided role', () => {
        const el = build('<div role="alert" />');
        expect(aria.getRole(el)).toEqual('alert');
      });

      it('returns the first valid provided role', () => {
        const el = build('<div role="invalid alert" />');
        expect(aria.getRole(el)).toEqual('alert');
      });

      it('returns an implicit role', () => {
        const el = build('<input />');
        expect(aria.getRole(el)).toEqual('textbox');
      });

      it('returns an implicit role if no valid role is provided', () => {
        const el = build('<input role="invalid" />');
        expect(aria.getRole(el)).toEqual('textbox');
      });

      it('does not return abstract roles', () => {
        const el = build('<input role="widget alert" />');
        expect(aria.getRole(el)).toEqual('alert');
      });
    });

    describe('#hasRole', () => {
      it('returns false for an element with no role', () => {
        const el = build('<div />');
        expect(aria.hasRole(el, 'none')).toEqual(false);
      });

      it('returns true for an element with an explicit role', () => {
        const el = build('<div role="button" />');
        expect(aria.hasRole(el, 'button')).toEqual(true);
      });

      it('returns true for an element with an implicit role', () => {
        const el = build('<button />');
        expect(aria.hasRole(el, 'button')).toEqual(true);
      });

      it('returns true for a parent superclass role', () => {
        const el = build('<button />');
        expect(aria.hasRole(el, 'command')).toEqual(true);
      });

      it('returns true for a ancestor superclass role', () => {
        const el = build('<button />');
        expect(aria.hasRole(el, 'roletype')).toEqual(true);
      });

      it('returns false for an invalid string role', () => {
        expect(aria.hasRole('xxx', 'button')).toEqual(false);
      });

      it('returns false for an non-matching string role', () => {
        expect(aria.hasRole('alert', 'button')).toEqual(false);
      });

      it('returns true for a matching string role', () => {
        expect(aria.hasRole('button', 'button')).toEqual(true);
      });

      it('returns true for an matching ancestor string role', () => {
        expect(aria.hasRole('button', 'roletype')).toEqual(true);
      });
    });
  });
});
