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
