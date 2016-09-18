describe('AccessibilityLinter', () => {
  class Logger {
    constructor() {
      this.errors = [];
    }

    error() {
      this.errors.push(Array.from(arguments));
    }
  }

  it('is a property of window', () => {
    expect(window.AccessibilityLinter).toBeA(Function);
  });

  context('running a test', () => {
    let linter;
    let logger;
    let el;

    before(() => {
      const tests = [{
        message: 'foo-bar',
        selector: 'accessibility-linter',
      }];
      logger = new Logger();
      linter = new AccessibilityLinter({ tests, logger });
      el = document.createElement('accessibility-linter');
      document.body.appendChild(el);
    });

    it('adds an error with a message and element', () => {
      linter.run();
      expect(logger.errors).toBe(['foo-bar', el]);
    });

    it('does not add the same error twice');
    it('limits the tests to the provided scope');
  });

  context('whitelist', () => {
    it('does not add errors to elements on the whitelist');
  });

  describe('#observe', () => {
    it('finds errors when DOM modifications occur');

    describe('#stopObserving', () => {
      it('stops finding errors when DOM modifications occur');
      it('resumes finding errors if #observe is called again');
    });
  });

  describe('default logger', () => {
    it('logs to console.error');
  });
});
