describe('HashObserver', () => {
  const { HashObserver } = AccessibilityLinter.observers;

  describe('#observe', () => {
    let observer;

    beforeEach(() => {
      window.location.hash = '';
    });

    afterEach(() => {
      observer.disconnect();
      observer = null;
    });

    it('ignores changes that do not match an id', async () => {
      const spy = mock.fn();
      observer = new HashObserver(spy);
      observer.observe(document);
      window.location.hash = '#foo';
      await nextTick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('ignores changes outside of the element context', async () => {
      const spy = mock.fn();
      const id = uniqueId();
      observer = new HashObserver(spy);
      const foo = appendToBody(`<foo /><foo id="${id}" />`);
      observer.observe(foo);
      window.location.hash = `#${id}`;
      await nextTick();
      expect(spy).not.toHaveBeenCalled();
    });

    describe('on the element', () => {
      it('observes a hash transitioning to a valid id', async () => {
        const spy = mock.fn();
        const id = uniqueId();
        observer = new HashObserver(spy);
        const foo = appendToBody(`<foo id="${id}" />`);
        observer.observe(foo);
        window.location.hash = `#${id}`;
        await nextTick();
        expect(spy).toHaveBeenCalledWith([foo]);
      });

      it('observes a hash transitioning from a valid id', async () => {
        const spy = mock.fn();
        const id = uniqueId();
        observer = new HashObserver(spy);
        const foo = appendToBody(`<foo id="${id}" />`);
        window.location.hash = `#${id}`;
        await nextTick();
        observer.observe(foo);
        window.location.hash = '';
        await nextTick();
        expect(spy).toHaveBeenCalledWith([foo]);
      });
    });

    describe('on a child of the element', () => {
      it('observes a hash transitioning to a valid id', async () => {
        const spy = mock.fn();
        const id = uniqueId();
        observer = new HashObserver(spy);
        const foo = appendToBody(`<foo><bar id="${id}" /></foo>`);
        observer.observe(foo);
        window.location.hash = `#${id}`;
        await nextTick();
        expect(spy).toHaveBeenCalledWith([foo]);
      });

      it('observes a hash transitioning from a valid id', async () => {
        const spy = mock.fn();
        const id = uniqueId();
        observer = new HashObserver(spy);
        const foo = appendToBody(`<foo><bar id="${id}" /></foo>`);
        window.location.hash = `#${id}`;
        await nextTick();
        observer.observe(foo);
        window.location.hash = '';
        await nextTick();
        expect(spy).toHaveBeenCalledWith([foo]);
      });
    });
  });

  describe('#disconnect', () => {
    it('stops listening for changes', async () => {
      const spy = mock.fn();
      const id = uniqueId();
      const observer = new HashObserver(spy);
      const foo = appendToBody(`<foo id="${id}" />`);
      observer.observe(foo);
      window.location.hash = `#${id}`;
      await nextTick();
      observer.disconnect();
      window.location.hash = '';
      await nextTick();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
