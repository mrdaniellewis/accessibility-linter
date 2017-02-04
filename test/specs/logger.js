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

  describe('#log', () => {
    ['error', 'warn'].forEach((type) => {
      context(type, () => {
        let spy;

        beforeEach(() => {
          spy = expect.spyOn(console, type);
        });

        afterEach(() => {
          spy.restore();
        });

        it('outputs a message', () => {
          logger.log({ type, message: 'bar' });
          expect(spy).toHaveBeenCalledWith('bar');
        });

        it('outputs a  message and element', () => {
          logger.log({ type, message: 'bar', el });
          expect(spy).toHaveBeenCalledWith('bar', el);
        });
      });
    });
  });
});
