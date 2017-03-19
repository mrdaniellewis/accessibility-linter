/**
 * Caching for element values
 */
/* eslint-disable class-methods-use-this */

function getOrSet(cache, key, setter) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const value = setter();
  cache.set(key, value);
  return value;
}

module.exports = class ElementCache {
  constructor() {
    this._cache = new WeakMap();
  }

  /**
   * Generate a key from the options supplied to key
   */
  key(el, key) {
    return key;
  }

  /**
   * Sets stored value
   */
  setter() {
    throw new Error('not implemented');
  }

  /**
   *  Get a value
   *  @param {Object} el A key to cache against
   */
  get(el) {
    const map = getOrSet(this._cache, el, () => new Map());
    const optionsKey = this.key.apply(this, arguments);
    return getOrSet(map, optionsKey, () => this.setter.apply(this, arguments));
  }
};
