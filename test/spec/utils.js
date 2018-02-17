describe('utils', () => {
  const { utils } = internals;

  describe('$$', () => {
    const { $$ } = utils;

    it('finds matching elements in a document', () => {
      const foo = appendToBody('<foo />');
      const bar = appendToBody('<bar />');
      appendToBody('<fee />');
      expect($$('foo,bar')).toEqual([foo, bar]);
    });

    it('finds matching elements in a context', () => {
      const foo = appendToBody('<foo><bar /></foo>');
      appendToBody('<foo />');
      const bar = foo.querySelector('bar');
      expect($$('foo,bar', foo)).toEqual([foo, bar]);
    });
  });

  describe('flatten', () => {
    const { flatten } = utils;

    it('returns an empty array with no arguments', () => {
      expect(flatten()).toEqual([]);
    });

    it('turns a single argument into an array', () => {
      expect(flatten('foo')).toEqual(['foo']);
    });

    it('flattens nested arrays', () => {
      expect(flatten(1, 2, [3, 4, [5, [6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('ExtendedArray', () => {
    const { ExtendedArray } = utils;

    it('extends Array', () => {
      expect(ExtendedArray.from([])).toBeInstanceOf(Array);
      expect(ExtendedArray.from([])).toBeInstanceOf(ExtendedArray);
    });

    describe('#flatten', () => {
      it('flattens the array', () => {
        const flattened = ExtendedArray.from([1, 2, [3, [4]]]).flatten();

        expect(flattened).toEqual([1, 2, 3, 4]);
        expect(flattened).toBeInstanceOf(ExtendedArray);
      });
    });

    describe('#compact', () => {
      it('compacts the array', () => {
        const compacted = ExtendedArray.from([true, 1, 0, false, '', null, NaN]).compact();

        expect(compacted).toEqual([true, 1]);
        expect(compacted).toBeInstanceOf(ExtendedArray);
      });
    });

    describe('#tap', () => {
      it('runs a function on the array and returns the array', () => {
        const array = ExtendedArray.from(['a']);
        const tapped = array.tap(a => a.push('b'));

        expect(tapped).toBe(array);
        expect(tapped).toEqual(['a', 'b']);
      });
    });
  });
});
