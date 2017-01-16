/**
 * Utils for working with the DOM
 */

const hidden = require('./hidden');

/**
 * Find DOM nodes from a selector.  The found node can include the supplied context
 * @param {String|NodeList} selector
 * @param {HTMLElement} [context]
 */
exports.$$ = function $$(selector, context) {
  const root = context || document;
  const els = Array.from(root.querySelectorAll(selector));
  if (context && context instanceof Element && context.matches(selector)) {
    els.push(context);
  }
  return els;
};

exports.$ = function $(selector, context) {
  return exports.$$(selector, context)[0];
};

exports.cssEscape = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};

exports.hidden = hidden;

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.observe = function mutationObserver(fn, root) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      Array.from(mutation.addedNodes)
        .filter(node => node.nodeType === Node.ELEMENT_NODE)
        .forEach(node => fn(node));
    });
  });
  observer.observe(root, { subtree: true, childList: true });
  return observer;
};
