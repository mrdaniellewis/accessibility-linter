describe('Runner', () => {
  const { Runner, ariaExtensions } = internals;
  const { Rule } = AccessibilityLinter;

  let noFoo;
  let noBar;
  beforeEach(() => {
    noFoo = new Rule({ selector: 'foo', message: 'noFoo', type: 'error', name: 'noFoo' });
    noBar = new Rule({ selector: 'bar', message: 'noBar', type: 'error', name: 'noBar' });
  });

  describe('#run', () => {
    it('runs all rules and returns errors', () => {
      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');
      appendToBody('<foo><bar /></foo>');
      const runner = new Runner({ rules: new Set([noFoo, noBar]) });
      expect(runner.run(foo)).toEqual([
        { message: 'noFoo', element: foo, rule: noFoo },
        { message: 'noBar', element: bar, rule: noBar },
      ]);
    });

    it('runs rules against multiple contexts', () => {
      const foo = appendToBody('<foo />');
      const bar = appendToBody('<bar />');
      const runner = new Runner({ rules: new Set([noFoo, noBar]) });
      expect(runner.run(foo, bar)).toEqual([
        { message: 'noFoo', element: foo, rule: noFoo },
        { message: 'noBar', element: bar, rule: noBar },
      ]);
    });


    it('does not run rules that are off', () => {
      const foo = appendToBody('<foo><bar /></foo>');
      const offRule = new Rule({ selector: 'bar', message: 'bar', type: 'off', name: 'offRule' });
      const runner = new Runner({ rules: new Set([noFoo, offRule]) });
      expect(runner.run(foo)).toEqual([
        { message: 'noFoo', element: foo, rule: noFoo },
      ]);
    });

    describe('errors against the document', () => {
      it('reports the error', () => {
        const documentRule = new class documentRule extends Rule {
          run(context, filter) {
            if (filter(document)) {
              return [{ element: document, message: 'no document' }];
            }
            return null;
          }
        }({ type: 'error' });
        const runner = new Runner({ rules: [documentRule] });
        expect(runner.run(document)).toEqual([
          { message: 'no document', element: document, rule: documentRule },
        ]);
      });
    });

    describe('global whitelist', () => {
      it('filters elements matching the global whitelist', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const runner = new Runner({ rules: new Set([noFoo, noBar]), whitelist: 'bar' });
        expect(runner.run(foo)).toEqual([
          { message: 'noFoo', element: foo, rule: noFoo },
        ]);
      });

      it('caches matched whitelist', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const bar = foo.querySelector('bar');
        const spy = mock.spyOn(bar, 'matches');
        const runner = new Runner({ rules: new Set([noFoo, noBar]), whitelist: 'bar' });
        runner.run(foo);
        runner.run(foo);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('rule whitelist', () => {
      it('filters elements matching a rule whitelist', () => {
        const noFooWhiteList = new Rule({ selector: 'foo', message: 'noFoo', type: 'error', whitelist: '.ignore', name: 'rule' });
        const foo = appendToBody('<foo/><foo class="ignore">');
        const runner = new Runner({ rules: new Set([noFooWhiteList]) });
        expect(runner.run(document)).toEqual([
          { message: 'noFoo', element: foo, rule: noFooWhiteList },
        ]);
      });

      it('caches matched whitelist', () => {
        const noFooWhiteList = new Rule({ selector: 'foo', message: 'noFoo', type: 'error', whitelist: '.ignore', name: 'rule' });
        appendToBody('<foo/><foo class="ignore">');
        const ignored = document.querySelector('.ignore');
        const spy = mock.spyOn(ignored, 'matches');
        const runner = new Runner({ rules: new Set([noFooWhiteList]) });
        runner.run(document);
        runner.run(document);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('attribute whitelist', () => {
      it('filters elements with an empty attribute whitelist', () => {
        const foo = appendToBody('<foo/><foo data-ignore />');
        const runner = new Runner({ rules: new Set([noFoo]), attributeName: 'data-ignore' });
        expect(runner.run(document)).toEqual([
          { message: 'noFoo', element: foo, rule: noFoo },
        ]);
      });

      it('filters elements with an named attribute whitelist', () => {
        const foo = appendToBody('<foo data-ignore="noBar" /><foo data-ignore="noFoo noBar" />');
        const runner = new Runner({ rules: new Set([noFoo]), attributeName: 'data-ignore' });
        expect(runner.run(document)).toEqual([
          { message: 'noFoo', element: foo, rule: noFoo },
        ]);
      });

      it('caches matched attributes', () => {
        const foo = appendToBody('<foo data-ignore />');
        const runner = new Runner({ rules: new Set([noFoo]), attributeName: 'data-ignore' });
        const spy = mock.spyOn(foo, 'getAttribute');
        runner.run(document);
        runner.run(document);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('previous errors', () => {
      it('filters elements with an previous error', () => {
        appendToBody('<foo />');
        const runner = new Runner({ rules: new Set([noFoo]) });
        expect(runner.run(document).length).toEqual(1);
        expect(runner.run(document)).toEqual([]);
      });

      it('filters document with a previous error', () => {
        const documentRule = new class documentRule extends Rule {
          run(context, filter) {
            if (filter(document)) {
              return [{ element: document, message: 'no document' }];
            }
            return [];
          }
        }({ type: 'error' });
        const runner = new Runner({ rules: [documentRule] });
        expect(runner.run(document).length).toEqual(1);
        expect(runner.run(document)).toEqual([]);
      });
    });

    describe('cache is false', () => {
      it('does not filter elements with a previous error', () => {
        appendToBody('<foo />');
        const runner = new Runner({ rules: new Set([noFoo]), cache: false });
        expect(runner.run(document).length).toEqual(1);
        expect(runner.run(document).length).toEqual(1);
      });

      it('does not cache matched whitelist', () => {
        const foo = appendToBody('<foo ignore />');
        const runner = new Runner({ rules: new Set([noFoo]), cache: false, whitelist: '[ignore]' });
        expect(runner.run(document).length).toEqual(0);
        foo.removeAttribute('ignore');
        expect(runner.run(document).length).toEqual(1);
      });

      it('does not cache matched rule whitelist', () => {
        const foo = appendToBody('<foo ignore />');
        const noFooWhiteList = new Rule({ selector: 'foo', message: 'noFoo', type: 'error', whitelist: '[ignore]', name: 'rule' });
        const runner = new Runner({ rules: new Set([noFooWhiteList]), cache: false });
        expect(runner.run(document).length).toEqual(0);
        foo.removeAttribute('ignore');
        expect(runner.run(document).length).toEqual(1);
      });

      it('does not cache matched attributes', () => {
        const foo = appendToBody('<foo ignore />');
        const runner = new Runner({ rules: new Set([noFoo]), cache: false, attributeName: 'ignore' });
        expect(runner.run(document).length).toEqual(0);
        foo.removeAttribute('ignore');
        expect(runner.run(document).length).toEqual(1);
      });
    });

    describe('aria-extensions', () => {
      it('caches values while running', () => {
        const foo = appendToBody('<foo />');
        const rule = new Rule({
          name: 'test-caching',
          selector: 'foo',
          test(element) {
            expect(element[ariaExtensions.symbols.visible]).toEqual(true);
            element.hidden = true;
            expect(element[ariaExtensions.symbols.visible]).toEqual(true);
            return 'error';
          },
        });
        const errors = new Runner({ rules: [rule] }).run(document);
        expect(errors).toHaveLength(1);
        expect(foo[ariaExtensions.symbols.visible]).toEqual(false);
      });
    });

    describe('setup and teardown', () => {
      it('calls setup and teardown in order', () => {
        let test = '';
        class LifecycleRule extends Rule {
          setup() {
            test += 's';
          }
          run() {
            test += 'r';
            return [];
          }
          teardown() {
            test += 't';
          }
        }
        const runner = new Runner({ rules: [new LifecycleRule(), new LifecycleRule()] });
        runner.run(document);
        expect(test).toEqual('ssrrtt');
      });

      it('calls setup and teardown with a run identifier', () => {
        const ids = [];
        class LifecycleRule extends Rule {
          setup(run) {
            ids.push(run);
          }
          teardown(run) {
            ids.push(run);
          }
        }
        const runner = new Runner({ rules: [new LifecycleRule(), new LifecycleRule()] });
        runner.run(document);
        runner.run(document);
        ids.slice(1, 4).forEach(id => expect(id).toBe(ids[0]));
        ids.slice(4, 8).forEach(id => expect(id).toBe(ids[4]));
        expect(ids[0]).not.toBe(ids[4]);
      });
    });
  });
});
