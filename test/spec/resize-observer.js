describe('ResizeObserver', () => {
  const { ResizeObserver } = AccessibilityLinter.observers;

  describe('#observe', () => {
    it('observes resizes on the element', () => {
      const spy = mock.fn();
      const observer = new ResizeObserver(spy);
      const foo = appendToBody('<foo />');
      observer.observe(foo);
      window.dispatchEvent(new Event('resize'));
      expect(spy).toHaveBeenCalledWith([foo]);
      observer.disconnect();
    });
  });

  describe('#disconnect', () => {
    it('stops observing resizes on the element', () => {
      const spy = mock.fn();
      const observer = new ResizeObserver(spy);
      const foo = appendToBody('<foo />');
      observer.observe(foo);
      window.dispatchEvent(new Event('resize'));
      observer.disconnect();
      window.dispatchEvent(new Event('resize'));
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

