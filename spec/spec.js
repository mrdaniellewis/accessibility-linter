describe('AccessibilityLinter', () => {
  const rule = {
    message: 'foo-bar',
    selector: 'accessibility-linter',
  };

  const rules = new Map([['rule', rule]]);

  it('is a property of window', () => {
    expect(window.AccessibilityLinter).toBeA(Function);
  });

  it('it has a version property', () => {
    expect(window.AccessibilityLinter.version).toExist();
  });

  let logger;

  beforeEach(() => {
    logger = new TestLogger();
  });

  context('running a rule', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ rules, logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('calls the logger with the rule and element', () => {
      linter.run();
      expect(logger).toHaveEntries([rule, el]);
    });

    it('does not add the same error twice', () => {
      linter.run();
      linter.run();
      expect(logger).toHaveEntries([rule, el]);
    });

    context('limiting scope', () => {
      let div, el2;

      before(() => {
        div = document.createElement('div');
        document.body.appendChild(div);
        el2 = document.createElement('accessibility-linter');
        div.appendChild(el2);
      });

      after(() => {
        div.remove();
      });

      it('limits the rules to the provided scope', () => {
        linter.run(div);
        expect(logger).toHaveEntries([rule, el2]);
      });
    });
  });

  describe('filter', () => {
    let linter, el, el2;
    const filterRule = {
      selector: 'accessibility-linter',
      filter: match => match.hasAttribute('data-test'),
    };

    beforeEach(() => {
      linter = new AccessibilityLinter({ rules: new Map([['rule', filterRule]]), logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
      el2 = document.createElement('accessibility-linter');
      el2.setAttribute('data-test', '');
      document.body.appendChild(el2);
    });

    afterEach(() => {
      el.remove();
      el2.remove();
    });

    it('filters out elements', () => {
      linter.run();
      expect(logger).toHaveEntries([filterRule, el2]);
    });
  });

  describe('whitelist', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('it adds errors for elements not on a whitelist', () => {
      const linter = new AccessibilityLinter({
        rules,
        logger,
      });

      linter.run();
      expect(logger).toHaveEntries([rule, el]);
    });

    it('does not add errors to elements on the global whitelist', () => {
      const linter = new AccessibilityLinter({
        rules,
        logger,
        whitelist: 'accessibility-linter',
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('does not add errors to elements on a test whitelist', () => {
      const linter = new AccessibilityLinter({
        rules,
        ruleSettings: {
          rule: { whitelist: 'accessibility-linter' },
        },
        logger,
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });
  });

  describe('enable', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('enables a rule by default', () => {
      const linter = new AccessibilityLinter({
        rules,
        logger,
      });

      linter.run();
      expect(logger).toHaveEntries([rule, el]);
    });

    it('disables a rule if the rule has enabled=false', () => {
      const linter = new AccessibilityLinter({
        rules: new Map([['rule', Object.assign({ enabled: false }, rule)]]),
        logger,
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('disables a rule if defaultOff is true', () => {
      const linter = new AccessibilityLinter({
        rules,
        logger,
        defaultOff: true,
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('disables a rule if defaultOff is true and the rule has enabled=true', () => {
      const linter = new AccessibilityLinter({
        rules: new Map([['rule', Object.assign({ enabled: true }, rule)]]),
        logger,
        defaultOff: true,
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('enables a rule if defaultOff is true and the rule settings have enabled=true', () => {
      const linter = new AccessibilityLinter({
        rules,
        logger,
        defaultOff: true,
        ruleSettings: { rule: { enabled: true } },
      });

      linter.run();
      expect(logger).toHaveEntries([rule, el]);
    });
  });

  describe('data-ignore attributes', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ rules, logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('ignores errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-accessibility-linter-ignore', '');
      linter.run();
      linter.run(); // Run twice as ignore matching is cached
      expect(logger).toNotHaveEntries();
    });

    it('ignores named errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-accessibility-linter-ignore', 'rule foo');
      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('does not ignore unnamed errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-accessibility-linter-ignore', 'foo');
      linter.run();
      expect(logger).toHaveEntries();
    });
  });

  describe('#observe', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ rules, logger });
      linter.observe();
    });

    afterEach(() => {
      linter.stopObserving();
      el.remove();
    });

    it('finds errors when DOM modifications occur', when(() => {
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    })
    .then(() => {
      expect(logger).toHaveEntries();
      el.remove();
    }));

    describe('#stopObserving', () => {
      it('stops finding errors when DOM modifications occur', when(() => {
        linter.stopObserving();
        el = document.createElement('accessibility-linter');
        document.body.appendChild(el);
      }).then(() => {
        expect(logger).toNotHaveEntries();
        el.remove();
      }));

      it('resumes finding errors if #observe is called again', when(() => {
        linter.stopObserving();
        linter.observe();
        el = document.createElement('accessibility-linter');
        document.body.appendChild(el);
      }).then(() => {
        expect(logger).toHaveEntries();
        el.remove();
      }));
    });
  });
});

describe('Logger', () => {
  it('is a property of AccessibilityLinter', () => {
    expect(AccessibilityLinter.Logger).toBeA(Function);
  });

  let logger, el;

  beforeEach(() => {
    el = document.createElement('b');
    el.setAttribute('data-foo', 'bar');
    logger = new AccessibilityLinter.Logger();
  });

  ['error', 'warn'].forEach((type) => {
    context(type, () => {
      let spy;

      beforeEach(() => {
        spy = expect.spyOn(console, type);
      });

      afterEach(() => {
        spy.restore();
      });

      it('outputs a string message', () => {
        logger[type]({ message: 'bar' });
        expect(spy).toHaveBeenCalledWith('bar');
      });

      it('outputs a function string message', () => {
        logger[type]({ message: () => 'bar' });
        expect(spy).toHaveBeenCalledWith('bar');
      });

      it('includes el in the message when provided', () => {
        logger[type]({ message: 'bar' }, el);
        expect(spy).toHaveBeenCalledWith('bar', el);
      });

      it('outputs a function message using el', () => {
        logger[type]({ message: elm => elm.getAttribute('data-foo') }, el);
        expect(spy).toHaveBeenCalledWith('bar', el);
      });

      it('includes link in the message when docLink and doc are provided', () => {
        const docLogger = new AccessibilityLinter.Logger('http://example.com/doc.htm');
        docLogger[type]({ message: 'bar', doc: 'hash' });
        expect(spy).toHaveBeenCalledWith('bar', 'http://example.com/doc.htm#hash');
      });

      it('includes link and el in the message when docLink and doc are provided', () => {
        const docLogger = new AccessibilityLinter.Logger('http://example.com/doc.htm');
        docLogger[type]({ message: 'bar', doc: 'hash' }, el);
        expect(spy).toHaveBeenCalledWith('bar', el, 'http://example.com/doc.htm#hash');
      });

      it('does not include the doc link if no docLink is provided', () => {
        logger[type]({ message: 'bar', doc: 'hash' }, el);
        expect(spy).toHaveBeenCalledWith('bar', el);
      });
    });
  });

  context('logging errors', () => {
    let spyError, spyWarning;

    const rule = {
      message: 'foo-bar',
      selector: 'accessibility-linter',
    };

    const rules = new Map([['rule', rule]]);

    beforeEach(() => {
      spyError = expect.spyOn(console, 'error');
      spyWarning = expect.spyOn(console, 'warn');
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      spyError.restore();
      spyWarning.restore();
      el.remove();
    });

    it('logs an error by default', () => {
      const linter = new AccessibilityLinter({ rules });
      linter.run();
      expect(spyError).toHaveBeenCalled();
      expect(spyWarning).toNotHaveBeenCalled();
    });

    it('logs a warning if the rule has type="warn"', () => {
      const linter = new AccessibilityLinter({ rules: new Map([['rule', Object.assign({ type: 'warn' }, rule)]]) });
      linter.run();
      expect(spyError).toNotHaveBeenCalled();
      expect(spyWarning).toHaveBeenCalled();
    });

    it('logs a warning if the rule settings have type="warn"', () => {
      const linter = new AccessibilityLinter({ rules, ruleSettings: { rule: { type: 'warn' } } });
      linter.run();
      expect(spyError).toNotHaveBeenCalled();
      expect(spyWarning).toHaveBeenCalled();
    });

    it('logs an error if the rule has type="warn" and settings have type="error"', () => {
      const linter = new AccessibilityLinter({
        rules: new Map([['rule', Object.assign({ type: 'warn' }, rule)]]),
        ruleSettings: { rule: { type: 'error' } },
      });
      linter.run();
      expect(spyError).toHaveBeenCalled();
      expect(spyWarning).toNotHaveBeenCalled();
    });
  });
});

// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  const context = { when };
  let frame;

  before((done) => {
    frame = document.createElement('iframe');
    frame.src = 'frame.htm';
    frame.style = 'border: 0; height: 0; width: 0;';
    document.body.appendChild(frame);
    frame.contentWindow.addEventListener('load', () => done());
  });

  after(() => {
    frame.remove();
  });

  ruleSpecs.forEach((spec, name) => {
    let window, rule, rules, cleaner;

    // Make sure everything is setup using the iFrame versions
    describe(name, () => {
      before(() => {
        window = context.window = frame.contentWindow;
        context.document = window.document;
        rule = context.rule = window.AccessibilityLinter.rules.get(name);
        rules = new Map([[name, rule]]);
        if (!rule) {
          throw new Error(`spec for "${name}" not found`);
        }
        window.onerror = function (message) {
          throw new Error(`Error in iframe ${message}`);
        };
      });

      beforeEach(() => {
        const logger = context.logger = new TestLogger();
        const linter = context.linter = new window.AccessibilityLinter({ logger, rules });
        linter.observe();
        cleaner = window.domCleaner();
      });

      // Execute in a promise so it runs next tick after any dom mutations
      afterEach(() => Promise.resolve().then(() => {
        cleaner.stop();
        cleaner.clean();
        cleaner = null;
      }));

      spec.call(context);
    });
  });
});
