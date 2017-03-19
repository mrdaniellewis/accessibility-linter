describe('SetCache', () => {
  let SetCache;

  beforeAll(() => (
    requireModule('../lib/support/set-cache.js')
      .then(ob => (SetCache = ob))
  ));

  describe('#has', () => {
    context('no cached value', () => {
      it('returns false', () => {
        expect(new SetCache().has({}, 'foo')).toEqual(false);
      });
    });

    context('cached values', () => {
      it('returns true', () => {
        const setCache = new SetCache();
        const ob = {};
        setCache.set(ob, 'foo');
        expect(setCache.has(ob, 'foo')).toEqual(true);
      });

      it('caches per object', () => {
        const setCache = new SetCache();
        setCache.set({}, 'foo');
        expect(setCache.has({}, 'foo')).toEqual(false);
      });

      it('caches per key', () => {
        const setCache = new SetCache();
        const ob = {};
        setCache.set(ob, 'foo');
        expect(setCache.has(ob, 'bar')).toEqual(false);
      });
    });
  });
});
