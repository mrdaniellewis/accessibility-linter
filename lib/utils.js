/**
 * Find DOM nodes from a selector or NodeList
 * @param {String|NodeList} selector
 * @param {HTMLElement} [context]
 */
exports.select = function select(selector, context) {
  let els = selector;
  if (typeof selector === 'string') {
    const root = context || document;
    els = root.querySelectorAll(selector);
  }
  return [].slice.call(els);
};

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.mutationObserver = function mutationObserver(fn) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => fn(mutation.target));
  });
  observer.observe(document, { subtree: true, childList: true });
};
