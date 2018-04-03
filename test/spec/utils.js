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

    describe('#compact', () => {
      it('compacts the array', () => {
        const compacted = ExtendedArray.from([true, 1, 0, false, '', null, NaN]).compact();

        expect(compacted).toEqual([true, 1]);
        expect(compacted).toBeInstanceOf(ExtendedArray);
      });
    });

    describe('#each', () => {
      it('runs forEach and returns the array', () => {
        const array = ExtendedArray.from([[], [], []]);
        const processed = array.each(item => item.push('x'));
        expect(array).toBe(processed);
        expect(array).toEqual([['x'], ['x'], ['x']]);
      });
    });

    describe('#flatten', () => {
      it('flattens the array', () => {
        const flattened = ExtendedArray.from([1, 2, [3, [4]]]).flatten();

        expect(flattened).toEqual([1, 2, 3, 4]);
        expect(flattened).toBeInstanceOf(ExtendedArray);
      });
    });

    describe('#groupBy', () => {
      it('groups values', () => {
        const array = ExtendedArray.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(array.groupBy(x => x % 3)).toEqual([[1, 4, 7, 10], [2, 5, 8], [3, 6, 9]]);
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

    describe('#unique', () => {
      it('it returns only unique elements', () => {
        const ob = {};
        const array = ExtendedArray.from([NaN, 'a', undefined, ob, 1, NaN, 'a', undefined, ob, 1, 'foo']);
        expect(array.unique()).toEqual([NaN, 'a', undefined, ob, 1, 'foo']);
      });
    });
  });
});
