describe('AccessibilityLinter', () => {
  clean();

  it('is a property of window', () => {
    expect(window.AccessibilityLinter).toBeA(Function);
  });

  it('it has a version property', () => {
    expect(window.AccessibilityLinter.version).toExist();
  });

  let Test, rules, logger, linter;

  beforeEach(() => {
    Test = class extends AccessibilityLinter.Rule {
      selector() {
        return 'foo';
      }

      test() {
        return 'foo-bar';
      }
    };
    rules = new Map([['rule', Test]]);
    logger = new TestLogger();
    linter = new AccessibilityLinter({ rules, logger });
  });

  context('#run', () => {
    it('calls the logger with the rule and element', () => {
      const el = appendToBody('<foo />');
      linter.run();
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    it('it does not add the same error twice', () => {
      const el = appendToBody('<foo />');
      linter.run();
      linter.run();
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    context('limiting scope', () => {
      it('limits the rules to the provided scope', () => {
        const el = appendToBody('<div><foo></div><foo />');
        linter.run(el);
        expect(logger).toHaveErrors(['foo-bar', el.firstChild]);
      });
    });

    describe('whitelist', () => {
      beforeEach(() => {
        linter = new AccessibilityLinter({
          rules,
          logger,
          whitelist: '.whitelist-global',
          ruleSettings: {
            rule: {
              whitelist: '.whitelist-rule',
            },
          },
        });
      });

      it('it adds errors for elements not on a whitelist', () => {
        const el = appendToBody('<foo />');
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });

      it('does not add errors for elements on the global whitelist', () => {
        appendToBody('<foo class="whitelist-global" />');
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('does not add errors for elements on a rule whitelist', () => {
        appendToBody('<foo class="whitelist-rule" />');
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('ignores changes to already whitelisted elements', () => {
        const el = appendToBody('<foo class="whitelist-global" />');
        linter.run();
        el.classList.remove('whitelist-global');
        linter.run();
        expect(logger).toNotHaveEntries();
      });
    });

    describe('enabled rules', () => {
      let el;

      beforeEach(() => {
        el = appendToBody('<foo />');
      });

      it('runs enabled rules', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          ruleSettings: { rule: { enabled: true } },
        });
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });

      it('does not run disabled rules', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          ruleSettings: { rule: { enabled: false } },
        });
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('disables rules by default if defaultOff is true', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          defaultOff: true,
        });
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('allows rules to be enabled explicitly when defaultOff is true', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          defaultOff: true,
          ruleSettings: { rule: { enabled: true } },
        });
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });
    });

    describe('ignoring rules', () => {
      it('ignores elements with an empty ignore data attribute', () => {
        appendToBody('<foo data-accessibility-linter-ignore />');
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('ignores rules listed in a string ignore data attribute', () => {
        appendToBody('<foo data-accessibility-linter-ignore="foo rule" />');
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('does not ignore rules not listed in a string ignore data attribute', () => {
        const el = appendToBody('<foo data-accessibility-linter-ignore="foo" />');
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });

      it('allows a custom ignore attribute', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          ignoreAttribute: 'foo-bar',
        });
        appendToBody('<foo foo-bar />');
        linter.run();
        expect(logger).toNotHaveEntries();
      });

      it('ignores modifications to the data ignore attribute', () => {
        const el = appendToBody('<foo data-accessibility-linter-ignore />');
        linter.run();
        delete el.dataset.accessibilityLinterIgnore;
        linter.run();
        expect(logger).toNotHaveEntries();
      });
    });

    describe('error types', () => {
      let el;

      beforeEach(() => {
        el = appendToBody('<foo />');
      });

      it('logs issues with a type "error" as an error', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          ruleSettings: { rule: { type: 'error' } },
        });
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });

      it('logs issues with a type "warn" as a warning', () => {
        linter = new AccessibilityLinter({
          logger,
          rules,
          ruleSettings: { rule: { type: 'warn' } },
        });
        linter.run();
        expect(logger.warns).toEqual([['foo-bar', el]]);
      });
    });

    describe('logging to the console', () => {
      it('logs errors', () => {
        linter = new AccessibilityLinter({ rules });
        const el = appendToBody('<foo />');
        const spy = expect.spyOn(console, 'error');
        linter.run();
        expect(spy.calls.length).toEqual(1);
        expect(spy).toHaveBeenCalledWith('foo-bar', el, 'rule');
      });

      it('logs warnings', () => {
        linter = new AccessibilityLinter({
          rules,
          ruleSettings: { rule: { type: 'warn' } },
        });
        const el = appendToBody('<foo />');
        const spy = expect.spyOn(console, 'warn');
        linter.run();
        expect(spy.calls.length).toEqual(1);
        expect(spy).toHaveBeenCalledWith('foo-bar', el, 'rule');
      });
    });

    context('cacheReported', () => {
      it('adds the same error twice if cacheReported is false', () => {
        const el = appendToBody('<foo />');
        linter = new AccessibilityLinter({
          logger,
          rules,
          cacheReported: false,
        });
        linter.run();
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el], ['foo-bar', el]);
      });

      it('does not ignore changes to the data ignore attribute', () => {
        const el = appendToBody('<foo data-accessibility-linter-ignore />');
        linter = new AccessibilityLinter({
          logger,
          rules,
          cacheReported: false,
        });
        linter.run();
        delete el.dataset.accessibilityLinterIgnore;
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });

      it('does not ignore changes to whitelisted elements', () => {
        const el = appendToBody('<foo class="ignore" />');
        linter = new AccessibilityLinter({
          logger,
          rules,
          whitelist: 'foo.ignore',
          cacheReported: false,
        });
        linter.run();
        el.classList.remove('ignore');
        linter.run();
        expect(logger).toHaveErrors(['foo-bar', el]);
      });
    });
  });

  context('#runRule', () => {
    beforeEach(() => {
      linter = new AccessibilityLinter({
        rules,
        logger,
        whitelist: '.old-whitelist',
        ruleSettings: { rule: { whitelist: '.rule-whitelist' } },
      });
    });

    it('runs a single rule by name', () => {
      const el = appendToBody('<foo />');
      linter.runRule('rule');
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    it('runs a single rule by object', () => {
      const el = appendToBody('<foo />');
      linter.runRule(linter.rules.get('rule'));
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    it('it allows a context', () => {
      const el = appendToBody('<div><foo></div><foo />');
      linter.runRule('rule', { context: el });
      expect(logger).toHaveErrors(['foo-bar', el.firstChild]);
    });

    it('it uses an existing whitelist', () => {
      appendToBody('<foo class="old-whitelist"/>');
      linter.runRule('rule');
      expect(logger).toNotHaveEntries();
    });

    it('it allows a custom whitelist', () => {
      const el = appendToBody('<foo /><foo class="new-whitelist">');
      linter.runRule('rule', { whitelist: '.new-whitelist' });
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    it('it uses existing rule settings', () => {
      appendToBody('<foo class="rule-whitelist"/>');
      linter.runRule('rule');
      expect(logger).toNotHaveEntries();
    });

    it('it uses custom rule settings', () => {
      appendToBody('<foo class="rule-whitelist"/>');
      const el = appendToBody('<foo class="new-whitelist"/>');
      linter.runRule('rule', { ruleSettings: { whitelist: '.new-whitelist' } });
      expect(logger).toHaveErrors(['foo-bar', el]);
    });

    it('it shows previous reported errors', () => {
      const el = appendToBody('<foo />');
      linter.runRule('rule');
      linter.runRule('rule');
      expect(logger).toHaveErrors(['foo-bar', el], ['foo-bar', el]);
    });
  });

  describe('#observe', () => {
    let el2, spy;

    beforeEach(() => {
      spy = expect.spyOn(linter, 'run').andCallThrough();
    });

    afterEach(() => {
      linter.stopObserving();
    });

    it('finds errors when nodes are added to the DOM', () => {
      linter.observe();
      appendToBody('<foo />');
      return whenDomUpdates(() => {
        expect(spy).toHaveBeenCalledWith(document.body);
        expect(logger).toHaveErrors();
      });
    });

    it('finds errors when DOM attributes are changed', () => {
      const el = appendToBody('<foo />');
      linter.observe();
      el.title = 'foo';
      return whenDomUpdates(() => {
        expect(spy).toHaveBeenCalledWith(document.body);
        expect(logger).toHaveErrors();
      });
    });

    it('finds errors when text nodes are changed', () => {
      const el = appendToBody('<foo />');
      linter.observe();
      el.textContent = 'foo';
      return whenDomUpdates(() => {
        expect(spy).toHaveBeenCalledWith(el);
        expect(logger).toHaveErrors();
      });
    });

    it('only tests against each DOM element once', () => {
      linter.observe();
      const el = appendToBody('<foo />');
      appendToBody('<foo />');
      el2 = document.createElement('foo');
      el.appendChild(el2);
      el.textContent = 'foo';
      return whenDomUpdates(() => {
        expect(spy).toHaveBeenCalledWith(document.body);
        expect(logger).toHaveErrors();
      });
    });

    it('does not test disconnected nodes', () => {
      // As the test act on a parent, we need to disconnect the parent
      const container = appendToBody('<div />');
      linter.observe();
      const el = document.createElement('foo');
      container.appendChild(el);
      container.remove();
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    describe('#stopObserving', () => {
      it('does nothing if no observing is happening', () => {
        linter.stopObserving();
      });

      it('stops finding errors when DOM modifications occur', () => {
        linter.observe();
        linter.stopObserving();
        appendToBody('<foo />');
        return whenDomUpdates(() => {
          expect(logger).toNotHaveEntries();
        });
      });

      it('resumes finding errors if #observe is called again', () => {
        linter.observe();
        linter.stopObserving();
        linter.observe();
        appendToBody('<foo />');
        return whenDomUpdates(() => {
          expect(logger).toHaveErrors();
        });
      });
    });
  });
});
