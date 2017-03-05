module.exports = class ElementCache {
  constructor() {
    this._cache = new WeakMap();
  }

  has(el, value) {
    const set = this._cache.get(el);
    if (!set) {
      return false;
    }
    return set.has(value);
  }

  set(el, value) {
    let set = this._cache.get(el);
    if (!set) {
      set = new Set();
      this._cache.set(el, set);
    }
    set.add(value);
  }
};
