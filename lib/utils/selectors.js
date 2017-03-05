const ExtendedArray = require('../support/extended-array');

exports.$$ = function $$(selector, context) {
  const root = context || document;
  const els = ExtendedArray.from(root.querySelectorAll(selector));
  if (context && context instanceof Element && context.matches(selector)) {
    els.push(context);
  }
  return els;
};

exports.$ = function $(selector, context) {
  return exports.$$(selector, context)[0];
};
