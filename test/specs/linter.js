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
