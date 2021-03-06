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

  describe('#enabled', () => {
    it('defaults to true', () => {
      expect(new Rule().enabled).toEqual(true);
    });
  });

  describe('custom settings', () => {
    beforeAll(() => {
      Test = class extends Rule {
        setDefaults() {
          this.enabled = false;
          this.type = 'warn';
          this.foo = 'bar';
        }
      };
    });

    describe('#setDefaults', () => {
      it('can be overridden to set default settings', () => {
        const test = new Test();
        expect(test.enabled).toEqual(false);
        expect(test.type).toEqual('warn');
        expect(test.foo).toEqual('bar');
      });
    });

    describe('settings', () => {
      it('has its properties copied to the object', () => {
        const test = new Test({
          enabled: true,
          type: 'error',
          foo: 'thumb',
        });
        expect(test.enabled).toEqual(true);
        expect(test.type).toEqual('error');
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

    beforeAll(() => {
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
      test.run(document, () => true, utils);

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

    describe('#selector', () => {
      it('is passed utils', () => {
        const test = new Test();
        const spy = expect.spyOn(test, 'selector');
        test.run(document, () => true, utils);
        expect(spy).toHaveHadCalls([utils]);
      });
    });

    describe('#test', () => {
      it('can return null to produce no error messages', () => {
        appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return null;
        };
        expect(test.run(document, () => true, utils)).toEqual([]);
      });

      it('can return an empty array to produce no error messages', () => {
        appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return [];
        };
        expect(test.run(document, () => true, utils)).toEqual([]);
      });

      it('can return a string to produce one error message', () => {
        const el = appendToBody('<foo />');
        const test = new Test();
        test.test = function () {
          return 'error';
        };
        expect(test.run(document, () => true, utils)).toEqual([{ el, message: 'error' }]);
      });

      it('can return an array of strings to produce multiple error messages', () => {
        const foo = appendToBody('<foo />');
        const bar = appendToBody('<bar />');
        const test = new Test();
        test.test = function () {
          return ['error', 'error2'];
        };
        expect(test.run(document, () => true, utils)).toEqual([
          { el: foo, message: 'error' },
          { el: foo, message: 'error2' },
          { el: bar, message: 'error' },
          { el: bar, message: 'error2' },
        ]);
      });
    });
  });
});
