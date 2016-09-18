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
  return Array.from(els);
};

/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
exports.observe = function mutationObserver(fn, root) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.from(mutation.addedNodes).forEach(node => fn(node));
    });
  });
  observer.observe(root, { subtree: true, childList: true });
  return observer;
};
