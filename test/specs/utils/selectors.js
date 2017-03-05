describe('selectors', () => {
  let utils;

  beforeEach(() => {
    utils = new AccessibilityLinter.Utils();
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
});
