module.exports = class ExtendedArray extends Array {
  tap(fn) {
    fn(this);
    return this;
  }

  unique() {
    const set = new Set();
    return this.filter(item => (set.has(item) ? false : set.add(item)));
  }

  groupBy(fn) {
    const map = new Map();
    this.forEach((item, i, ar) => {
      const key = fn(item, i, ar);
      if (map.has(key)) {
        map.get(key).push(item);
      } else {
        map.set(key, ExtendedArray.of(item));
      }
    });
    return ExtendedArray.from(map.values());
  }

  compact() {
    return this.filter(Boolean);
  }

  flatten() {
    let result = new ExtendedArray();
    this.forEach((item) => {
      if (Array.isArray(item)) {
        result = result.concat(ExtendedArray.from(item).flatten());
      } else {
        result.push(item);
      }
    });
    return result;
  }
};
