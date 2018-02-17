describe('DomObserver', () => {
  const { DomObserver } = AccessibilityLinter.observers;

  describe('#observe', () => {
    let observer;
    afterEach(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    it('observes attribute mutations', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo />');
      observer.observe(foo);
      foo.setAttribute('foo', 'bar');
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('observes attribute mutations on children', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.setAttribute('foo', 'bar');
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('observes character data mutations', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo />');
      observer.observe(foo);
      foo.innerText = 'bar';
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('observes character data mutations on children', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar>bar</bar></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.firstChild.data = 'foo';
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([bar]);
    });

    it('observes child list mutations', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar></foo>');
      observer.observe(foo);
      foo.appendChild(document.createElement('fee'));
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('observes child list mutations on children', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar><fee /></bar></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.appendChild(document.createElement('foe'));
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([bar]);
    });

    it('returns a parent element on a child list transition to :empty', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar><fee /></bar></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.innerHTML = '';
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('returns a parent element on a child list transition from :empty', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.appendChild(document.createElement('fee'));
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('returns a parent element on character data transition from :empty', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');
      const text = document.createTextNode('');
      bar.appendChild(text);
      observer.observe(foo);
      text.data = 'foo';
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });

    it('returns a parent element on character data transition to :empty', async () => {
      const spy = mock.fn();
      observer = new DomObserver(spy);

      const foo = appendToBody('<foo><bar>foo</bar></foo>');
      const bar = foo.querySelector('bar');
      observer.observe(foo);
      bar.firstChild.data = '';
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith([foo]);
    });
  });

  describe('#disconnect', () => {
    it('stops observing mutations', async () => {
      const spy = mock.fn();
      const observer = new DomObserver(spy);

      const foo = appendToBody('<foo />');
      observer.observe(foo);
      foo.setAttribute('foo', 'bar');
      await Promise.resolve();
      observer.disconnect();
      foo.setAttribute('bar', 'foo');
      await Promise.resolve();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
