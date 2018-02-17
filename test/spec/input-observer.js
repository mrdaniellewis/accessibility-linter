describe('InputObserver', () => {
  const { InputObserver } = AccessibilityLinter.observers;

  describe('#observe', () => {
    let observer;
    afterEach(() => {
      observer.disconnect();
      observer = null;
    });

    describe('<input>', () => {
      describe('observing the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const input = appendToBody('<input />');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.value = 'foo';
          expect(spy).toHaveBeenCalledWith([input]);
        });

        it('observes changes to checked', () => {
          const spy = mock.fn();
          const input = appendToBody('<input type="checkbox" />');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.checked = true;
          expect(spy).toHaveBeenCalledWith([input]);
        });

        it('observes changes to indeterminate', () => {
          const spy = mock.fn();
          const input = appendToBody('<input type="checkbox" />');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.indeterminate = true;
          expect(spy).toHaveBeenCalledWith([input]);
        });
      });

      describe('observing an ancestor of the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><input /></foo>');
          const input = foo.querySelector('input');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'foo';
          expect(spy).toHaveBeenCalledWith([foo]);
        });

        it('observes changes to checked', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><input type="checkbox" /></foo>');
          const input = foo.querySelector('input');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.checked = true;
          expect(spy).toHaveBeenCalledWith([foo]);
        });

        it('observes changes to indeterminate', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><input type="checkbox" /></foo>');
          const input = foo.querySelector('input');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.indeterminate = true;
          expect(spy).toHaveBeenCalledWith([foo]);
        });
      });

      describe('observing another element', () => {
        it('does not observe changes', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo />');
          const input = appendToBody('<input />');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'x';
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });

    describe('<textarea>', () => {
      describe('observing the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const input = appendToBody('<textarea />');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.value = 'foo';
          expect(spy).toHaveBeenCalledWith([input]);
        });
      });

      describe('observing an ancestor of the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><textarea /></foo>');
          const input = foo.querySelector('textarea');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'foo';
          expect(spy).toHaveBeenCalledWith([foo]);
        });
      });

      describe('observing another element', () => {
        it('does not observe changes', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo />');
          const input = appendToBody('<textarea />');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'x';
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });

    describe('<select>', () => {
      describe('observing the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.value = 'bar';
          expect(spy).toHaveBeenCalledWith([input]);
        });

        it('observes changes to selectedIndex', () => {
          const spy = mock.fn();
          const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
          observer = new InputObserver(spy);
          observer.observe(input);
          input.selectedIndex = 1;
          expect(spy).toHaveBeenCalledWith([input]);
        });
      });

      describe('observing an ancestor of the element', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><select><option value="foo" /><option value="bar" /></select></foo>');
          const input = foo.querySelector('select');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'bar';
          expect(spy).toHaveBeenCalledWith([foo]);
        });

        it('observes changes to selectedIndex', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><select><option value="foo" /><option value="bar" /></select></foo>');
          const input = foo.querySelector('select');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.selectedIndex = 1;
          expect(spy).toHaveBeenCalledWith([foo]);
        });
      });

      describe('observing another element', () => {
        it('does not observe changes', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo />');
          const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
          observer = new InputObserver(spy);
          observer.observe(foo);
          input.value = 'bar';
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });

    describe('<option>', () => {
      describe('observing the parent select', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const input = appendToBody('<select><option value="foo" /><option value="bar" selected /></select>');
          const option = input.querySelector('option');
          observer = new InputObserver(spy);
          observer.observe(input);
          option.selected = true;
          expect(spy).toHaveBeenCalledWith([input]);
        });
      });

      describe('observing an ancestor of the parent select', () => {
        it('observes changes to value', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo><select><option value="foo" /><option value="bar" selected /></select></foo>');
          const option = foo.querySelector('option');
          observer = new InputObserver(spy);
          observer.observe(foo);
          option.selected = true;
          expect(spy).toHaveBeenCalledWith([foo]);
        });
      });

      describe('observing another element', () => {
        it('does not observe changes', () => {
          const spy = mock.fn();
          const foo = appendToBody('<foo />');
          const option = appendToBody('<select><option value="foo" /><option value="bar" selected /></select>')
            .querySelector('option');
          observer = new InputObserver(spy);
          observer.observe(foo);
          option.selected = true;
          expect(spy).not.toHaveBeenCalled();
        });
      });

      describe('observing a datalist', () => {
        it('does not observe changes', () => {
          const spy = mock.fn();
          const list = appendToBody('<datalist><option value="foo" /><option value="bar" selected /></datalist>');
          const option = list.querySelector('option');
          observer = new InputObserver(spy);
          observer.observe(list);
          option.selected = true;
          expect(spy).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('#disconnect', () => {
    describe('<input>', () => {
      it('stops observing value', () => {
        const spy = mock.fn();
        const input = appendToBody('<input />');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.value = 'foo';
        observer.disconnect();
        input.value = 'bar';
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('stops observing checked', () => {
        const spy = mock.fn();
        const input = appendToBody('<input type="checkbox" />');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.checked = true;
        observer.disconnect();
        input.checked = false;
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('stops observing indeterminate', () => {
        const spy = mock.fn();
        const input = appendToBody('<input type="checkbox" />');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.indeterminate = true;
        observer.disconnect();
        input.indeterminate = false;
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('<textarea>', () => {
      it('stops observing value', () => {
        const spy = mock.fn();
        const input = appendToBody('<textarea />');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.value = 'foo';
        observer.disconnect();
        input.value = 'bar';
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('<select>', () => {
      it('stops observing value', () => {
        const spy = mock.fn();
        const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.value = 'bar';
        observer.disconnect();
        input.value = 'foo';
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('stops observing selectedIndex', () => {
        const spy = mock.fn();
        const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
        const observer = new InputObserver(spy);
        observer.observe(input);
        input.selectedIndex = 1;
        observer.disconnect();
        input.selectedIndex = 0;
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('<option>', () => {
      it('stops observing selected', () => {
        const spy = mock.fn();
        const input = appendToBody('<select><option value="foo" /><option value="bar" /></select>');
        const option = input.querySelector('option');
        const observer = new InputObserver(spy);
        observer.observe(input);
        option.selected = true;
        observer.disconnect();
        option.selected = false;
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
