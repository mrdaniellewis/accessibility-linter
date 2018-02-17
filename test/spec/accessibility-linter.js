describe('AccessibilityLinter', () => {
  const { Rule } = AccessibilityLinter;

  it('is a property of window', () => {
    expect(AccessibilityLinter).toBeInstanceOf(Function);
  });

  describe('.version', () => {
    it('it matches the npm package version number', async () => {
      const packageJson = await fetch('../package.json').then(response => response.json());
      expect(AccessibilityLinter.version).toEqual(packageJson.version);
    });
  });

  describe('#run', () => {
    it('reports issues on the document', () => {
      const reporter = { error: mock.fn(), warn: mock.fn() };
      const fooRule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
      const barRule = new Rule({ name: 'test', selector: 'bar', message: 'no bar', type: 'warn' });
      const linter = new AccessibilityLinter({ rules: [fooRule, barRule], reporters: [reporter] });
      const foo = appendToBody('<foo />');
      const bar = appendToBody('<bar />');
      linter.run();

      expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule: fooRule, element: foo });
      expect(reporter.warn).toHaveBeenCalledWith({ message: 'no bar', rule: barRule, element: bar });
    });

    it('reports issues scoped to a provided element', () => {
      const reporter = { error: mock.fn() };
      const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
      const linter = new AccessibilityLinter({ rules: [rule], reporters: [reporter] });
      const foo = appendToBody('<foo />');
      appendToBody('<foo />');
      linter.run(foo);

      expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
      expect(reporter.error).toHaveBeenCalledTimes(1);
    });

    it('reports nothing if no issues are found', () => {
      const reporter = { error: mock.fn() };
      const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
      const linter = new AccessibilityLinter({ rules: [rule], reporters: [reporter] });
      linter.run();

      expect(reporter.error).not.toHaveBeenCalled();
    });

    it('reporst nothing for a rule that is off', () => {
      const reporter = { error: mock.fn() };
      const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo', type: 'off' });
      const linter = new AccessibilityLinter({ rules: [rule], reporters: [reporter] });
      appendToBody('<foo />');
      linter.run();

      expect(reporter.error).not.toHaveBeenCalled();
    });

    describe('whitelist', () => {
      it('does no report issues with elements on the global whitelist', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo,bar', message: 'no foo bar' });
        const linter = new AccessibilityLinter({ rules: [rule], reporters: [reporter], whitelist: 'foo' });
        appendToBody('<foo />');
        const bar = appendToBody('<bar />');
        linter.run();

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo bar', rule, element: bar });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('attributeName', () => {
      it('does not report issues whitelisted using an attribute', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo,bar', message: 'no foo bar' });
        const linter = new AccessibilityLinter({ rules: [rule], reporters: [reporter], attributeName: 'ignore' });
        appendToBody('<foo ignore />');
        const bar = appendToBody('<bar />');
        linter.run();

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo bar', rule, element: bar });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#runRule', () => {
    describe('named rule', () => {
      it('runs only the provided rule on the document', () => {
        const reporter = { error: mock.fn() };
        const fooRule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const barRule = new Rule({ name: 'test-bar', selector: 'bar', message: 'no bar' });
        const linter = new AccessibilityLinter({
          rules: [fooRule, barRule],
          reporters: [reporter],
        });
        const foo = appendToBody('<foo />');
        appendToBody('<bar />');
        linter.runRule('test-foo');

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule: fooRule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });

      it('runs the rule scoped to the provided element', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({ reporters: [reporter] });
        const foo = appendToBody('<foo />');
        appendToBody('<foo />');
        linter.runRule(rule, { element: foo });

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });

      it('runs the rule with the original whitelist', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({ reporters: [reporter], whitelist: '[ignore]' });
        const foo = appendToBody('<foo />');
        appendToBody('<foo ignore />');
        linter.runRule(rule, { whitelist: '[ignore]' });

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });

      it('runs the rule with the provided whitelist', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({ reporters: [reporter], whitelist: '[keep]' });
        const foo = appendToBody('<foo keep />');
        appendToBody('<foo ignore />');
        linter.runRule(rule, { whitelist: '[ignore]' });

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });

      it('runs the rule disabling the original whitelist', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({ reporters: [reporter], whitelist: '[keep]' });
        const foo = appendToBody('<foo keep />');
        linter.runRule(rule, { whitelist: null });

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });

      it('runs the rule with attributeName', () => {
        const reporter = { error: mock.fn() };
        const rule = new Rule({ name: 'test', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({ reporters: [reporter], attributeName: 'ignore' });
        const foo = appendToBody('<foo />');
        appendToBody('<foo ignore />');
        linter.runRule(rule);

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('rule instance', () => {
      it('runs the rule on the document', () => {
        const reporter = { error: mock.fn() };
        const fooRule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const barRule = new Rule({ name: 'test-bar', selector: 'bar', message: 'no bar' });
        const linter = new AccessibilityLinter({
          rules: [barRule],
          reporters: [reporter],
        });
        const foo = appendToBody('<foo />');
        appendToBody('<bar />');
        linter.runRule(fooRule);

        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule: fooRule, element: foo });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('object rule', () => {
      it('runs the rule on the document', () => {
        const reporter = { error: mock.fn() };
        const barRule = new Rule({ name: 'test-bar', selector: 'bar', message: 'no bar' });
        const linter = new AccessibilityLinter({
          rules: [barRule],
          reporters: [reporter],
        });
        const foo = appendToBody('<foo />');
        appendToBody('<bar />');
        const rule = { name: 'foo-rule', selector: 'foo', message: 'no foo' };
        linter.runRule(rule);

        expect(reporter.error.mock.calls[0][0]).toMatchObject({
          message: 'no foo',
          element: foo,
          rule: {
            name: 'foo-rule',
            selector: 'foo',
            message: 'no foo',
            type: 'error',
          },
        });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#observe', () => {
    it('observes for changes using the provided observers', async () => {
      const reporter = { error: mock.fn() };
      let foo;
      class Observer {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {
          foo = appendToBody('<foo />');
          this.callback([foo]);
        }
        disconnect() {}
      }
      const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
      const linter = new AccessibilityLinter({
        rules: [rule],
        reporters: [reporter],
        observers: [Observer],
      });
      linter.observe();
      expect(reporter.error).not.toHaveBeenCalled();
      await nextTick();
      expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', rule, element: foo });
    });

    it('passes the element context to the observer', () => {
      class Observer {}
      Observer.prototype.observe = mock.fn();
      const linter = new AccessibilityLinter({ observers: [Observer] });
      const foo = appendToBody('<foo />');
      linter.observe(foo);
      expect(Observer.prototype.observe).toHaveBeenCalledWith(foo);
    });

    it('does not pass the same element muliple times to the runner', async () => {
      let foo;
      class Observer {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {
          foo = appendToBody('<foo />');
          this.callback([foo, foo]);
        }
        disconnect() {}
      }
      const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
      const spy = mock.spyOn(rule, 'run');
      const linter = new AccessibilityLinter({
        rules: [rule],
        observers: [Observer],
      });
      linter.observe();
      await nextTick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not pass children of an element to the runner', async () => {
      let foo;
      class Observer {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {
          foo = appendToBody('<foo><foo /></foo>');
          this.callback([foo, foo.querySelector('foo')]);
        }
        disconnect() {}
      }
      const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
      const spy = mock.spyOn(rule, 'run');
      const linter = new AccessibilityLinter({
        rules: [rule],
        observers: [Observer],
      });
      linter.observe();
      await nextTick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not pass disconnected nodes to the runner', async () => {
      let foo;
      class Observer {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {
          foo = appendToBody('<foo><foo /></foo>');
          this.callback([foo]);
        }
        disconnect() {}
      }
      const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
      const spy = mock.spyOn(rule, 'run');
      const linter = new AccessibilityLinter({
        rules: [rule],
        observers: [Observer],
      });
      linter.observe();
      foo.remove();
      await nextTick();
      expect(spy).not.toHaveBeenCalled();
    });

    describe('rateLimit', () => {
      it('debounces changes', async () => {
        const reporter = { error: mock.fn() };
        let foo1;
        let foo2;
        class Observer {
          constructor(callback) {
            this.callback = callback;
          }
          observe() {
            foo1 = appendToBody('<foo />');
            this.callback([foo1]);
            Promise.resolve().then(() => {
              foo2 = appendToBody('<foo />');
              this.callback([foo2]);
            });
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
        });
        linter.observe();
        expect(reporter.error).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(reporter.error).not.toHaveBeenCalled();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledTimes(2);
      });

      it('uses the rateLimit for debouncing', async () => {
        const reporter = { error: mock.fn() };
        let foo;
        class Observer {
          constructor(callback) {
            this.callback = callback;
          }
          observe() {
            foo = appendToBody('<foo />');
            this.callback([foo]);
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
          rateLimit: 300,
        });
        linter.observe();
        await nextTick();
        expect(reporter.error).not.toHaveBeenCalled();
        await nextTick(300);
        expect(reporter.error).toHaveBeenCalled();
      });
    });

    describe('whitelist', () => {
      it('rules are run with the whitelist', async () => {
        const reporter = { error: mock.fn() };
        class Observer {
          constructor(callback) {
            this.callback = callback;
          }
          observe() {
            this.callback(document.querySelectorAll('foo'));
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
          whitelist: '[ignore]',
        });
        const foo = appendToBody('<foo />');
        appendToBody('<foo ignore />');
        linter.observe();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', element: foo, rule });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('attributeName', () => {
      it('rules are run with the attributeName', async () => {
        const reporter = { error: mock.fn() };
        class Observer {
          constructor(callback) {
            this.callback = callback;
          }
          observe() {
            this.callback(document.querySelectorAll('foo'));
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
          attributeName: 'ignore',
        });
        const foo = appendToBody('<foo />');
        appendToBody('<foo ignore />');
        linter.observe();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledWith({ message: 'no foo', element: foo, rule });
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('cache', () => {
      it('by default repeat errors are not reported', async () => {
        const reporter = { error: mock.fn() };
        const foo = appendToBody('<foo />');
        let observer;
        class Observer {
          constructor(callback) {
            this.callback = callback;
            observer = this;
          }
          observe() {
            this.callback([foo]);
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
          attributeName: 'ignore',
        });
        linter.observe();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledTimes(1);
        reporter.error.mockClear();
        observer.observe();
        await nextTick();
        expect(reporter.error).not.toHaveBeenCalled();
      });

      it('when false repeat errors are reported', async () => {
        const reporter = { error: mock.fn() };
        const foo = appendToBody('<foo />');
        let observer;
        class Observer {
          constructor(callback) {
            this.callback = callback;
            observer = this;
          }
          observe() {
            this.callback([foo]);
          }
          disconnect() {}
        }
        const rule = new Rule({ name: 'test-foo', selector: 'foo', message: 'no foo' });
        const linter = new AccessibilityLinter({
          rules: [rule],
          observers: [Observer],
          reporters: [reporter],
          attributeName: 'ignore',
          cache: false,
        });
        linter.observe();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledTimes(1);
        reporter.error.mockClear();
        observer.observe();
        await nextTick();
        expect(reporter.error).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#disconnect', () => {
    it('stops observing for changes', () => {
      class Observer { observe() {} }
      Observer.prototype.disconnect = mock.fn();
      const linter = new AccessibilityLinter({
        observers: [Observer],
      });
      linter.observe();
      linter.disconnect();
      expect(Observer.prototype.disconnect).toHaveBeenCalled();
    });
  });
});
