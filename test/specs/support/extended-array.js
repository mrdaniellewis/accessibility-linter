describe('ExtendedArray', () => {
  let ExtendedArray;

  beforeAll(() => (
    requireModule('../lib/support/extended-array.js')
      .then(ob => (ExtendedArray = ob))
  ));

  it('extends array', () => {
    expect(new ExtendedArray()).toBeAn(Array);
  });

  describe('#tap', () => {
    it('runs a function with the array as the argument', () => {
      const array = new ExtendedArray();
      const spy = expect.createSpy();
      array.tap(spy);
      expect(spy).toHaveBeenCalledWith(array);
    });

    it('returns the original array', () => {
      const array = new ExtendedArray();
      expect(array.tap(() => {})).toBeAn(ExtendedArray);
    });
  });

  describe('#unique', () => {
    it('removes elements that are not unique from the array', () => {
      const ob = {};
      const ob2 = {};
      const array = new ExtendedArray(undefined, undefined, null, null, 'foo', 'foo', 'bar', 1, 1, 2, 3, 4, 5, ob, ob, ob2);
      expect(array.unique()).toEqual([undefined, null, 'foo', 'bar', 1, 2, 3, 4, 5, ob, ob2]);
    });

    it('returns an ExtendedArray', () => {
      const array = new ExtendedArray();
      expect(array.unique()).toBeAn(ExtendedArray);
    });
  });

  describe('#groupBy', () => {
    it('groups elements by the results of the provided function', () => {
      const array = new ExtendedArray('apple', 'apricot', 'banana', 'pear', 'potato');
      expect(array.groupBy(item => item[0])).toEqual([['apple', 'apricot'], ['banana'], ['pear', 'potato']]);
    });

    it('returns an ExtendedArray', () => {
      const array = new ExtendedArray();
      expect(array.groupBy(() => {})).toBeAn(ExtendedArray);
    });

    it('subelements are ExtendedArrays', () => {
      const array = ExtendedArray.of(1);
      expect(array.groupBy(() => 1)[0]).toBeAn(ExtendedArray);
    });

    it('function is called with item, index and array', () => {
      const array = ExtendedArray.of('foo');
      const spy = expect.createSpy();
      array.groupBy(spy);
      expect(spy).toHaveBeenCalledWith('foo', 0, array);
    });
  });

  describe('#compact', () => {
    it('removes falsey elements', () => {
      const array = ExtendedArray.of(0, undefined, null, '', NaN, false, true, 1, 'foo');
      expect(array.compact()).toEqual([true, 1, 'foo']);
    });

    it('returns an ExtendedArray', () => {
      const array = new ExtendedArray();
      expect(array.compact()).toBeAn(ExtendedArray);
    });
  });

  describe('#flatten', () => {
    it('flattens the array', () => {
      const array = ExtendedArray.of('foo', null, ['bar', null, ['foe', null]], 'fee');
      expect(array.flatten()).toEqual(['foo', null, 'bar', null, 'foe', null, 'fee']);
    });

    it('returns an ExtendedArray', () => {
      const array = new ExtendedArray();
      expect(array.flatten()).toBeAn(ExtendedArray);
    });
  });
});
