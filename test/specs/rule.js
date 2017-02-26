/* eslint-disable class-methods-use-this */
describe('Rule', () => {
  const Rule = AccessibilityLinter.Rule;
  let Test;

  it('is a property of AccessibilityLinter', () => {
    expect(Rule).toBeA(Function);
  });

  describe('#type', () => {
    it('defaults to "error"', () => {
      expect(new Rule().type).toEqual('error');
    });
  });

  describe('#includeHidden', () => {
    it('defaults to false', () => {
      expect(new Rule().includeHidden).toEqual(false);
    });
  });

  describe('#enabled', () => {
    it('defaults to true', () => {
      expect(new Rule().enabled).toEqual(true);
    });
  });

  describe('custom settings', () => {
    before(() => {
      Test = class extends Rule {
        setDefaults() {
          this.enabled = false;
          this.type = 'warn';
          this.includeHidden = true;
          this.foo = 'bar';
        }
      };
    });

    describe('#setDefaults', () => {
      it('can be overridden to set default settings', () => {
        const test = new Test();
        expect(test.enabled).toEqual(false);
        expect(test.type).toEqual('warn');
        expect(test.includeHidden).toEqual(true);
        expect(test.foo).toEqual('bar');
      });
    });

    describe('settings', () => {
      it('has its properties copied to the object', () => {
        const test = new Test({
          enabled: true,
          type: 'error',
          includeHidden: false,
          foo: 'thumb',
        });
        expect(test.enabled).toEqual(true);
        expect(test.type).toEqual('error');
        expect(test.includeHidden).toEqual(false);
        expect(test.foo).toEqual('thumb');
      });
    });
  });

  describe('#run', () => {
    let utils;

    clean();

    beforeEach(() => {
      utils = new AccessibilityLinter.Utils();
    });

    before(() => {
      Test = class extends Rule {
        selector() {
          return 'foo,bar';
        }
      };
    });

    it('finds the elements specified by #selector and passes them to #test', () => {
      const foo = appendToBody('<foo />');
      const bar = appendToBody('<bar />');
      appendToBody('<thumb />');
      const test = new Test();
      const spy = expect.spyOn(test, 'test');
      test.run(null, () => true, utils);

      expect(spy).toHaveHadCalls([foo, utils], [bar, utils]);
    });

    describe('context parameter', () => {
      it('limits the scope of the search to that element, and its children', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const bar = foo.querySelector('bar');
        appendToBody('<bar />');
        const test = new Test();
        const spy = expect.spyOn(test, 'test');
        test.run(foo, () => true, utils);

        expect(spy).toHaveHadCalls([foo, utils], [bar, utils]);
      });
    });

    describe('filter parameter', () => {
      it('filters found elements', () => {
        const foo = appendToBody('<foo />');
        appendToBody('<bar />');
        const test = new Test();
        const spy = expect.spyOn(test, 'test');
        test.run(document, el => el.nodeName.toLowerCase() === 'foo', utils);

        expect(spy).toHaveHadCalls([foo, utils]);
      });
    });

    describe('#select', () => {
      it('can be overridden to return arbitrary elements', () => {
        appendToBody('<foo />');
        const thumb = appendToBody('<thumb />');
        const test = new Test();
        test.select = function () {
          return [thumb];
        };
        const spy = expect.spyOn(test, 'test');
        test.run(null, () => true, utils);

        expect(spy).toHaveHadCalls([thumb, utils]);
      });
    });

    describe('#includeHidden', () => {
      it('filters hidden elements when false', () => {
        appendToBody('<foo aria-hidden="true" />');
        const test = new Test({ includeHidden: false });
        const spy = expect.spyOn(test, 'test');
        test.run(null, () => true, utils);

        expect(spy).toNotHaveBeenCalled();
      });

      it('does not filter hidden elements when true', () => {
        const foo = appendToBody('<foo aria-hidden="true" />');
        const test = new Test({ includeHidden: true });
        const spy = expect.spyOn(test, 'test');
        test.run(null, () => true, utils);

        expect(spy).toHaveHadCalls([foo, utils]);
      });
    });

    describe('#test', () => {
      it('can return null to produce no error messages', () => {
        appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return null;
        };
        expect(test.run(null, () => true, utils)).toEqual([]);
      });

      it('can return an empty array to produce no error messages', () => {
        appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return [];
        };
        expect(test.run(null, () => true, utils)).toEqual([]);
      });

      it('can return a string to produce one error message', () => {
        const el = appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return 'error';
        };
        expect(test.run(null, () => true, utils)).toEqual([{ el, message: 'error', type: 'error' }]);
      });

      it('can return an array of strings to produce multiple error messages', () => {
        const foo = appendToBody('<foo />');
        const bar = appendToBody('<bar />');
        const test = new Test();
        test.test = function () {
          return ['error', 'error2'];
        };
        expect(test.run(null, () => true, utils)).toEqual([
          { el: foo, message: 'error', type: 'error' },
          { el: foo, message: 'error2', type: 'error' },
          { el: bar, message: 'error', type: 'error' },
          { el: bar, message: 'error2', type: 'error' },
        ]);
      });

      it('custom types are returned with the errors', () => {
        const foo = appendToBody('<foo />');
        const test = new Test({ type: 'warn' });
        test.test = function () {
          return 'error';
        };
        expect(test.run(null, () => true, utils)).toEqual([{ el: foo, message: 'error', type: 'warn' }]);
      });
    });
  });
});
