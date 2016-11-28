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

    it('it is false for elements that are not hidden', () => {
      const el = appendToBody('<div>x</div>');
      expect(utils.hidden(el)).toEqual(false);
    });

    it('it is true for elements that have aria-hidden=true', () => {
      const el = appendToBody('<div aria-hidden="true">x</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('it is true for elements that have a parent set to aria-hidden=true', () => {
      const el = appendToBody('<div aria-hidden="true"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('it is true for elements that are display: none', () => {
      const el = appendToBody('<div style="display: none">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('it is true for elements that have a parent set to display: none', () => {
      const el = appendToBody('<div style="display: none"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('it is true for elements that are visibility: hidden', () => {
      const el = appendToBody('<div style="visibility: hidden">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('it is true for elements that have a parent set to visibility: hidden', () => {
      const el = appendToBody('<div style="visibility: hidden"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });

    it('it is true for elements that are visibility: collapse', () => {
      const el = appendToBody('<div style="visibility: collapse">foo</div>');
      expect(utils.hidden(el)).toEqual(true);
    });

    it('it is true for elements that have a parent set to visibility: collapse', () => {
      const el = appendToBody('<div style="visibility: collapse"><p>foo</p></div>');
      expect(utils.hidden(utils.$('p', el))).toEqual(true);
    });
  });
});
