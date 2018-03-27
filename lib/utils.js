export const flatten = (...args) => (
  [].concat(...args.map(arg => (Array.isArray(arg) ? flatten(...arg) : arg)))
);

export class ExtendedArray extends Array {
  compact() {
    return this.filter(Boolean);
  }

  flatten() {
    return ExtendedArray.from(flatten(this));
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

  tap(fn) {
    fn(this);
    return this;
  }

  unique() {
    const found = new Set();
    return this.filter((item) => {
      if (found.has(item)) {
        return false;
      }
      found.add(item);
      return true;
    });
  }
}

export const $$ = (selector, context = document) => {
  const found = ExtendedArray.from(context.querySelectorAll(selector));
  if (context instanceof Element && context.matches(selector)) {
    found.unshift(context);
  }
  return found;
};

export const ancestors = (element, selector) => {
  const found = [];
  let node;
  while ((node = node.parentElement)) {
    if (!selector || node.matches(selector)) {
      found.push(node);
    }
  }
  return found.reverse();
};

// https://www.w3.org/TR/html52/infrastructure.html#common-parser-idioms
export const rSpace = /[ \t\n\f\r]+/;
