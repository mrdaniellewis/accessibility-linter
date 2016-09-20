describe('AccessibilityLinter', () => {
  class Logger {
    error() {}
  }

  const test = {
    name: 'test',
    message: 'foo-bar',
    selector: 'accessibility-linter',
  };

  it('is a property of window', () => {
    expect(window.AccessibilityLinter).toBeA(Function);
  });

  context('running a test', () => {
    let linter, logger, el, spy;

    beforeEach(() => {
      logger = new Logger();
      linter = new AccessibilityLinter({ tests: [test], logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
      spy = expect.spyOn(logger, 'error');
    });

    afterEach(() => {
      el.remove();
    });

    it('calls the logger with the test and element', () => {
      linter.run();
      expect(spy.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(test, el);
    });

    it('does not add the same error twice', () => {
      linter.run();
      spy.reset();
      linter.run();
      expect(spy).toNotHaveBeenCalled();
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
        expect(spy.calls.length).toEqual(1);
        expect(spy).toHaveBeenCalledWith(test, el2);
      });
    });
  });

  describe('filter', () => {
    let linter, logger, el, el2, spy;
    const filterTest = {
      name: 'test',
      selector: 'accessibility-linter',
      filter: match => match.hasAttribute('data-test'),
    };

    beforeEach(() => {
      logger = new Logger();
      linter = new AccessibilityLinter({ tests: [filterTest], logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
      el2 = document.createElement('accessibility-linter');
      el2.setAttribute('data-test', '');
      document.body.appendChild(el2);
      spy = expect.spyOn(logger, 'error');
    });

    afterEach(() => {
      el.remove();
      el2.remove();
    });

    it('filters out elements', () => {
      linter.run();
      expect(spy.calls.length).toEqual(1);
      expect(spy).toHaveBeenCalledWith(filterTest, el2);
    });
  });

  context('whitelist', () => {
    let logger, el, spy;

    beforeEach(() => {
      logger = new Logger();
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
      spy = expect.spyOn(logger, 'error');
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
      expect(spy).toNotHaveBeenCalled();
    });

    it('does not add named errors to elements on a whitelist with test names', () => {
      const linter = new AccessibilityLinter({
        tests: [test],
        logger,
        whitelist: { 'accessibility-linter': ['test'] },
      });

      linter.run();
      expect(spy).toNotHaveBeenCalled();
    });

    it('adds unnamed errors to elements on a whitelist', () => {
      const linter = new AccessibilityLinter({
        tests: [test],
        logger,
        whitelist: { 'accessibility-linter': ['foo'] },
      });

      linter.run();
      expect(spy).toHaveBeenCalled();
    });
  });

  context('data-ignore attributes', () => {
    let linter, logger, el, spy;

    beforeEach(() => {
      logger = new Logger();
      linter = new AccessibilityLinter({ tests: [test], logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
      spy = expect.spyOn(logger, 'error');
    });

    afterEach(() => {
      el.remove();
    });

    it('ignores errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', '');
      linter.run();
      linter.run(); // Run twice as ignore matching is cached
      expect(spy).toNotHaveBeenCalled();
    });

    it('ignores named errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', 'test foo');
      linter.run();
      expect(spy).toNotHaveBeenCalled();
    });

    it('does not ignore unnamed errors where there is a data-ignore attribute', () => {
      el.setAttribute('data-allylint-ignore', 'foo');
      linter.run();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#observe', () => {
    let linter, logger, el;

    beforeEach(() => {
      logger = new Logger();
      linter = new AccessibilityLinter({ tests: [test], logger });
      linter.observe();
    });

    afterEach(() => {
      linter.stopObserving();
      el.remove();
    });

    it('finds errors when DOM modifications occur', () => {
      const spy = expect.spyOn(logger, 'error');
      return whenDomChanges(() => {
        el = document.createElement('accessibility-linter');
        document.body.appendChild(el);
      })
      .then(() => {
        expect(spy).toHaveBeenCalled();
        el.remove();
      });
    });

    describe('#stopObserving', () => {
      it('stops finding errors when DOM modifications occur', () => {
        const spy = expect.spyOn(logger, 'error');
        linter.stopObserving();
        return whenDomChanges(() => {
          el = document.createElement('accessibility-linter');
          document.body.appendChild(el);
        })
        .then(() => {
          expect(spy).toNotHaveBeenCalled();
          el.remove();
        });
      });

      it('resumes finding errors if #observe is called again', () => {
        const spy = expect.spyOn(logger, 'error');
        linter.stopObserving();
        linter.observe();
        return whenDomChanges(() => {
          el = document.createElement('accessibility-linter');
          document.body.appendChild(el);
        })
        .then(() => {
          expect(spy).toHaveBeenCalled();
          el.remove();
        });
      });
    });
  });
});

describe('Logger', () => {
  context('error', () => {
    it('generates an error where message is a string');
    it('generates an error where message is a function');
    it('logs errors to the console');
  });

  context('warning', () => {
    it('generates a warning where message is a string');
    it('generates a warning where message is a function');
    it('logs warnings to the console');
  });
});
