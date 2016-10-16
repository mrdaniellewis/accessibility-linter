describe('AccessibilityLinter', () => {
  const test = {
    message: 'foo-bar',
    selector: 'accessibility-linter',
  };

  const tests = new Map([['test', test]]);

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

  context('running a test', () => {
    let linter, el;

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests, logger });
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
      selector: 'accessibility-linter',
      filter: match => match.hasAttribute('data-test'),
    };

    beforeEach(() => {
      linter = new AccessibilityLinter({ tests: new Map([['test', filterTest]]), logger });
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
        tests,
        logger,
        whitelist: { 'accessibility-linter': '' },
      });

      linter.run();
      linter.run(); // run twice as whitelist matching is cached
      expect(logger.errors).toEqual([]);
    });

    it('does not add named errors to elements on a whitelist with test names', () => {
      const linter = new AccessibilityLinter({
        tests,
        logger,
        whitelist: { 'accessibility-linter': ['test'] },
      });

      linter.run();
      expect(logger).toNotHaveEntries();
    });

    it('adds unnamed errors to elements on a whitelist', () => {
      const linter = new AccessibilityLinter({
        tests,
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
      linter = new AccessibilityLinter({ tests, logger });
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
      linter = new AccessibilityLinter({ tests, logger });
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
});

// Tests are run in an iframe so mocha display does not interfere
describe('tests', () => {
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

  testSpecs.forEach((spec, name) => {
    let window, test, tests;

    // Make sure everything is setup using the iFrame versions
    describe(name, () => {
      before(() => {
        window = context.window = frame.contentWindow;
        context.document = window.document;
        test = context.test = window.AccessibilityLinter.tests.get(name);
        tests = new Map([[name, test]]);
        if (!test) {
          throw new Error(`spec for "${name}" not found`);
        }
        window.onerror = function (message) {
          throw new Error(`Error in iframe ${message}`);
        };
      });

      beforeEach(() => {
        const logger = context.logger = new TestLogger();
        const linter = context.linter = new window.AccessibilityLinter({ logger, tests });
        linter.observe();
      });

      spec.call(context);
    });
  });
});
