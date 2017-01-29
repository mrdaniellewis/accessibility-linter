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

    it('accepts a second style parameter', () => {
      const el = appendToBody('<div style="display: none">foo</div>');
      const style = window.getComputedStyle(el);
      const spy = expect.spyOn(window, 'getComputedStyle');
      expect(utils.hidden(el, style)).toEqual(true);
      expect(spy).toNotHaveBeenCalled();
      spy.restore();
    });
  });

  describe('text alternatives', () => {
    clean();

    before(() => {
      AccessibilityLinter.elements['native-text'] = {
        nativeLabel(el) {
          return el.getAttribute('data-alt') || null;
        },

        nativeDescription(el) {
          return el.getAttribute('data-description') || null;
        },
      };

      AccessibilityLinter.elements['native-elements'] = {
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
      };
    });

    after(() => {
      delete AccessibilityLinter.elements['native-text'];
      delete AccessibilityLinter.elements['native-elements'];
    });

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
});
