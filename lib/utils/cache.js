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

module.exports = class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate a key from the options supplied to key
   */
  key(el, key) {
    return key;
  }

  setter() {
    throw new Error('unimplemented');
  }

  /**
   *  Get a value
   *  @param {Object} el A key to cache against
   */
  get(el) {
    const optionsKey = this.key.apply(this, arguments);
    const cache = getOrSet(this.cache, optionsKey, () => new WeakMap());
    return getOrSet(cache, el, () => this.setter.apply(this, arguments));
  }
};
