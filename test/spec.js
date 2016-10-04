describe('AccessibilityLinter', () => {
  const test = {
    name: 'test',
    message: 'foo-bar',
    selector: 'accessibility-linter',
  };

  it('is a property of window', () => {
    expect(window.AccessibilityLinter).toBeA(Function);
  });

  let logger;

  beforeEach(() => {
    logger = new TestLogger();
  });

  context('running a test', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests: [test], logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('calls the logger with the test and element', () => {
      linter.run();
      expect(logger).toHaveEntries([test, el]);
    });

    it('does not add the same error twice', () => {
      linter.run();
      linter.run();
      expect(logger).toHaveEntries([test, el]);
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

      it('limits the tests to the provided scope', () => {
        linter.run(div);
        expect(logger).toHaveEntries([test, el2]);
      });
    });
  });

  describe('filter', () => {
    let linter, el, el2;
    const filterTest = {
      name: 'test',
      selector: 'accessibility-linter',
      filter: match => match.hasAttribute('data-test'),
    };

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests: [filterTest], logger });
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
      expect(logger).toHaveEntries([filterTest, el2]);
    });
  });

  context('whitelist', () => {
    let el;

    beforeEach(() => {
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('does not add errors to elements on a whitelist with no test names', () => {
      const linter = new AccessibilityLinter({
        tests: [test],
        logger,
        whitelist: { 'accessibility-linter': '' },
      });

      linter.run();
      linter.run(); // run twice as whitelist matching is cached
      expect(logger.errors).toEqual([]);
    });

    it('does not add named errors to elements on a whitelist with test names', () => {
      const linter = new AccessibilityLinter({
        tests: [test],
        logger,
        whitelist: { 'accessibility-linter': ['test'] },
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('adds unnamed errors to elements on a whitelist', () => {
      const linter = new AccessibilityLinter({
        tests: [test],
        logger,
        whitelist: { 'accessibility-linter': ['foo'] },
      });

      linter.run();
      expect(logger).toHaveEntries();
    });
  });

  context('data-ignore attributes', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests: [test], logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    afterEach(() => {
      el.remove();
    });

    it('ignores errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', '');
      linter.run();
      linter.run(); // Run twice as ignore matching is cached
      expect(logger).toNotHaveEntries();
    });

    it('ignores named errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', 'test foo');
      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('does not ignore unnamed errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', 'foo');
      linter.run();
      expect(logger).toHaveEntries();
    });
  });

  describe('#observe', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests: [test], logger });
      linter.observe();
    });

    afterEach(() => {
      linter.stopObserving();
      el.remove();
    });

    it('finds errors when DOM modifications occur', () => (
      whenDomChanges(() => {
        el = document.createElement('accessibility-linter');
        document.body.appendChild(el);
      })
      .then(() => {
        expect(logger).toHaveEntries();
        el.remove();
      })
    ));

    describe('#stopObserving', () => {
      it('stops finding errors when DOM modifications occur', () => {
        linter.stopObserving();
        return whenDomChanges(() => {
          el = document.createElement('accessibility-linter');
          document.body.appendChild(el);
        })
        .then(() => {
          expect(logger).toNotHaveEntries();
          el.remove();
        });
      });

      it('resumes finding errors if #observe is called again', () => {
        linter.stopObserving();
        linter.observe();
        return whenDomChanges(() => {
          el = document.createElement('accessibility-linter');
          document.body.appendChild(el);
        })
        .then(() => {
          expect(logger).toHaveEntries();
          el.remove();
        });
      });
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

  context('error', () => {
    let spy;

    beforeEach(() => {
      spy = expect.spyOn(console, 'error');
    });

    afterEach(() => {
      spy.restore();
    });

    it('generates an error where message is a string', () => {
      logger.error({ message: 'bar' }, el);
      expect(spy).toHaveBeenCalledWith('bar', el);
    });

    it('generates an error where message is a function', () => {
      logger.error({ message: elm => elm.getAttribute('data-foo') }, el);
      expect(spy).toHaveBeenCalledWith('bar', el);
    });
  });

  context('warn', () => {
    let spy;

    beforeEach(() => {
      spy = expect.spyOn(console, 'warn');
    });

    afterEach(() => {
      spy.restore();
    });

    it('generates an error where message is a string', () => {
      logger.warn({ message: 'bar' }, el);
      expect(spy).toHaveBeenCalledWith('bar', el);
    });

    it('generates an error where message is a function', () => {
      logger.warn({ message: elm => elm.getAttribute('data-foo') }, el);
      expect(spy).toHaveBeenCalledWith('bar', el);
    });
  });
});

describe('tests', () => {
  testSpecs.forEach((spec, test) => {
    describe(test.name, () => {
      const context = { logger: null, test, linter: null };

      beforeEach(() => {
        const logger = context.logger = new TestLogger();
        const linter = context.linter = new AccessibilityLinter({ logger, tests: [test] });
        linter.observe();
      });

      afterEach(() => {
        (window.domAdditions || []).splice(0).forEach(el => el.remove());
      });

      spec.call(context);
    });
  });
});
