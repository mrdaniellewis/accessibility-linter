describe('EventObserver', () => {
  const { EventObserver } = AccessibilityLinter.observers;

  describe('#observe', () => {
    let observer;
    afterEach(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    ['focus', 'blur', 'load', 'error', 'transitionend', 'transitioncancel', 'change', 'click', 'input'].forEach((name) => {
      describe(`${name} event`, () => {
        it('observes for event on the element', () => {
          const spy = mock.fn();
          observer = new EventObserver(spy);
          const foo = appendToBody('<foo />');
          observer.observe(foo);
          foo.dispatchEvent(new Event(name));
          expect(spy).toHaveBeenCalledWith([foo]);
        });

        it('observes for event on a child element', () => {
          const spy = mock.fn();
          observer = new EventObserver(spy);
          const foo = appendToBody('<foo><bar /></foo>');
          const bar = foo.querySelector('bar');
          observer.observe(foo);
          bar.dispatchEvent(new Event(name));
          expect(spy).toHaveBeenCalledWith([foo]);
        });
      });
    });
  });

  describe('#disconnect', () => {
    ['focus', 'blur', 'load', 'error', 'transitionend', 'transitioncancel', 'change', 'click', 'input'].forEach((name) => {
      describe(`${name} event`, () => {
        it('stops observing', () => {
          const spy = mock.fn();
          const observer = new EventObserver(spy);
          const foo = appendToBody('<foo />');
          observer.observe(foo);
          foo.dispatchEvent(new Event(name));
          observer.disconnect();
          foo.dispatchEvent(new Event(name));
          expect(spy).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
