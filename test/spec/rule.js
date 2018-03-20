describe('Rule', () => {
  const { Rule } = AccessibilityLinter;

  describe('#name', () => {
    it('is set from options', () => {
      expect(new Rule({ name: 'foo' }).name).toEqual('foo');
    });

    it('is set from the constructor', () => {
      class Foo extends Rule {}
      expect(new Foo({ name: 'bar' }).name).toEqual('Foo');
    });

    it('throws without a name', () => {
      expect(() => new Rule()).toThrow('rule must have a name');
    });
  });

  describe('#type', () => {
    it('defaults to error', () => {
      expect(new Rule({ name: 'foo' }).type).toEqual('error');
    });

    it('is set from options', () => {
      expect(new Rule({ type: 'off', name: 'foo' }).type).toEqual('off');
    });
  });

  describe('#whitelist', () => {
    it('defaults to falsey', () => {
      expect(new Rule({ name: 'foo' }).whitelist).toBeFalsy();
    });

    it('is set from options', () => {
      expect(new Rule({ whitelist: 'foo', name: 'foo' }).whitelist).toEqual('foo');
    });
  });

  describe('#selector', () => {
    it('is set from options', () => {
      expect(new Rule({ selector: '*', name: 'foo' }).selector).toEqual('*');
    });

    it('will not be set if there is an existing implementation', () => {
      class Foo extends Rule {
        get selector() {
          return 'foo';
        }
      }
      expect(new Foo({ selector: '*' }).selector).toEqual('foo');
    });
  });

  describe('#test', () => {
    it('is set from options', () => {
      const test = () => {};
      expect(new Rule({ test, name: 'foo' }).test).toEqual(test);
    });

    it('will not be set if there is an existing implementation', () => {
      class Foo extends Rule {
        test() {}
      }
      expect(new Foo({ test: () => {} }).test).toEqual(Foo.prototype.test);
    });
  });

  describe('#message', () => {
    it('is set from options', () => {
      expect(new Rule({ message: 'foo', name: 'foo' }).message).toEqual('foo');
    });

    it('will not be set if there is an existing implementation', () => {
      class Foo extends Rule {
        get message() {
          return 'bar';
        }
      }
      expect(new Foo({ message: 'foo' }).message).toEqual('bar');
    });
  });

  describe('#run', () => {
    it('returns an ExtendedArray for no errors', () => {
      const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo' }).run(document, () => true);
      expect(errors).toEqual([]);
      expect(errors.constructor.name).toEqual('ExtendedArray');
    });

    it('finds elements in a context and returns a message', () => {
      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');
      appendToBody('<foo />');

      const errors = new Rule({ selector: 'foo,bar', message: 'bar', name: 'foo' }).run(foo, () => true);
      expect(errors).toEqual([{ element: foo, message: 'bar' }, { element: bar, message: 'bar' }]);
    });

    it('uses filter to filter found elements', () => {
      const foo = appendToBody('<foo><bar /></foo>');
      const bar = foo.querySelector('bar');

      const errors = new Rule({ selector: 'foo,bar', message: 'bar', name: 'foo' }).run(foo, el => el !== bar);
      expect(errors).toEqual([{ element: foo, message: 'bar' }]);
    });

    describe('#visibleOnly', () => {
      describe('when false', () => {
        it('does not filter', () => {
          const foo = appendToBody('<foo hidden />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo' }).run(foo, () => true);
          expect(errors).toEqual([{ element: foo, message: 'bar' }]);
        });
      });

      describe('when true', () => {
        it('does not filter visible elements', () => {
          const foo = appendToBody('<foo />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: true }).run(foo, () => true);
          expect(errors).toEqual([{ element: foo, message: 'bar' }]);
        });

        it('does not filter aria-hidden elements', () => {
          const foo = appendToBody('<foo aria-hidden="true" />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: true }).run(foo, () => true);
          expect(errors).toEqual([{ element: foo, message: 'bar' }]);
        });

        it('filters hidden elements', () => {
          const foo = appendToBody('<foo hidden />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: true }).run(foo, () => true);
          expect(errors).toEqual([]);
        });
      });

      describe('when "aria"', () => {
        it('does not filter visible elements', () => {
          const foo = appendToBody('<foo />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: 'aria' }).run(foo, () => true);
          expect(errors).toEqual([{ element: foo, message: 'bar' }]);
        });

        it('filters aria-hidden elements', () => {
          const foo = appendToBody('<foo aria-hidden="true" />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: 'aria' }).run(foo, () => true);
          expect(errors).toEqual([]);
        });

        it('filters hidden elements', () => {
          const foo = appendToBody('<foo hidden />');
          const errors = new Rule({ selector: 'foo', message: 'bar', name: 'foo', visibleOnly: 'aria' }).run(foo, () => true);
          expect(errors).toEqual([]);
        });
      });
    });

    describe('#test', () => {
      it('test can filter all found elements', () => {
        appendToBody('<foo><bar /></foo>');

        const errors = new Rule({ selector: 'foo,bar', test: () => null, name: 'foo' }).run(document, () => true);
        expect(errors).toEqual([]);
      });

      it('test can set the error messages', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const bar = foo.querySelector('bar');

        const errors = new Rule({ selector: 'foo,bar', test: el => el.nodeName, name: 'foo' }).run(document, () => true);
        expect(errors).toEqual([{ element: foo, message: 'FOO' }, { element: bar, message: 'BAR' }]);
      });

      it('test can return multiple errors', () => {
        const foo = appendToBody('<foo><bar /></foo>');
        const bar = foo.querySelector('bar');

        const errors = new Rule({ selector: 'foo,bar', test: el => [el.nodeName, 'foo'], name: 'foo' })
          .run(document, () => true);

        expect(errors).toEqual([
          { element: foo, message: 'FOO' },
          { element: foo, message: 'foo' },
          { element: bar, message: 'BAR' },
          { element: bar, message: 'foo' },
        ]);
      });

      it('does not call test if filter returns false', () => {
        const spy = mock.fn();
        appendToBody('<foo />');

        new Rule({ selector: 'foo', test: spy, name: 'foo' }).run(document, () => false);
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});

describe('XPathRule', () => {
  const { XPathRule } = AccessibilityLinter;

  it('finds elements with a document context', () => {
    const foo = appendToBody('<foo data-foo />');

    const errors = new XPathRule({ selector: 'foo[@data-foo]', name: 'foo', message: 'no foo' })
      .run(document, () => true);

    expect(errors).toEqual([{ element: foo, message: 'no foo' }]);
  });

  it('finds elements with a non-document context', () => {
    const foo = appendToBody('<foo data-foo />');
    appendToBody('<foo data-foo />');

    const errors = new XPathRule({ selector: 'foo[@data-foo]', name: 'foo', message: 'no foo' })
      .run(foo, () => true);

    expect(errors).toEqual([{ element: foo, message: 'no foo' }]);
  });

  it('selects the parentNode of a text node', () => {
    const foo = appendToBody('<foo>foo</foo>');

    const errors = new XPathRule({ selector: "text()[.='foo']", name: 'foo', message: 'no foo' })
      .run(document, () => true);

    expect(errors).toEqual([{ element: foo, message: 'no foo' }]);
  });
});

describe('AriaRule', () => {
  const { AriaRule } = AccessibilityLinter;

  it('finds elements with a document context', () => {
    const h1 = appendToBody('<h1 />');
    const heading = appendToBody('<div role="heading" />');

    const errors = new AriaRule({ selector: ['heading'], name: 'heading', message: 'no heading' })
      .run(document, () => true);

    expect(errors).toEqual([
      { element: h1, message: 'no heading' },
      { element: heading, message: 'no heading' },
    ]);
  });

  it('finds elements with a non-document context', () => {
    appendToBody('<h1 />');
    const heading = appendToBody('<div role="heading" />');

    const errors = new AriaRule({ selector: ['heading'], name: 'heading', message: 'no heading' })
      .run(heading, () => true);

    expect(errors).toEqual([
      { element: heading, message: 'no heading' },
    ]);
  });
});
