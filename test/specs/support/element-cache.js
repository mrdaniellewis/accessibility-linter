describe('ElementCache', () => {
  let ElementCache;
  let TestCache;

  beforeAll(() => (
    requireModule('../lib/support/element-cache.js')
      .then(ob => (ElementCache = ob))
  ));

  beforeAll(() => {
    TestCache = class extends ElementCache {
      setter(ob, prop) {
        return ob[prop];
      }
    };
  });

  it('constructs an ElementCache', () => {
    expect(new TestCache()).toBeAn(ElementCache);
  });

  it('initially generates a value using #setter', () => {
    const cache = new TestCache();
    expect(cache.get({ foo: 'bar' }, 'foo')).toEqual('bar');
  });

  it('caches a set value', () => {
    const cache = new TestCache();
    const ob = { foo: 'bar' };
    expect(cache.get(ob, 'foo')).toEqual('bar');
    const spy = expect.spyOn(cache, 'setter');
    expect(cache.get(ob, 'foo')).toEqual('bar');
    expect(spy).toNotHaveBeenCalled();
  });

  it('caches values per object', () => {
    const cache = new TestCache();
    expect(cache.get({ foo: 'bar' }, 'foo')).toEqual('bar');
    expect(cache.get({ foo: 'foe' }, 'foo')).toEqual('foe');
  });

  it('caches values by key', () => {
    const cache = new TestCache();
    const ob = { foo: 'bar', foe: 'thumb' };
    expect(cache.get(ob, 'foo')).toEqual('bar');
    expect(cache.get(ob, 'foe')).toEqual('thumb');
  });

  it('generates the key using #key', () => {
    const cache = new TestCache();
    cache.key = () => 'foo';
    const ob = { foo: 'bar' };
    expect(cache.get(ob, 'foo')).toEqual('bar');
    expect(cache.get(ob, 'foe')).toEqual('bar');
  });
});
