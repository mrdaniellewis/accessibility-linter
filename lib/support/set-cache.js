module.exports = class SetCache {
  constructor() {
    this._map = new WeakMap();
  }

  has(key, value) {
    if (!this._map.has(key)) {
      return false;
    }
    return this._map.get(key).includes(value);
  }

  set(key, value) {
    if (!this._map.has(key)) {
      this._map.set(key, [value]);
    } else {
      this._map.get(key).push(value);
    }
  }
};

