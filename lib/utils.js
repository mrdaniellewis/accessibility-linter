export const flatten = (...args) => (
  [].concat(...args.map(arg => (Array.isArray(arg) ? flatten(...arg) : arg)))
);

export class ExtendedArray extends Array {
  flatten() {
    return ExtendedArray.from(flatten(this));
  }

  compact() {
    return this.filter(Boolean);
  }

  tap(fn) {
    fn(this);
    return this;
  }
}

export const $$ = (selector, context = document) => {
  const found = ExtendedArray.from(context.querySelectorAll(selector));
  if (context instanceof Element && context.matches(selector)) {
    found.unshift(context);
  }
  return found;
};

// https://www.w3.org/TR/html52/infrastructure.html#common-parser-idioms
export const rSpace = /[ \t\n\f\r]+/;
