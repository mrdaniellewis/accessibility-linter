/**
 * Observe for child list mutations
 * @param {Function} fn function to call for each mutation
 */
module.exports = function mutationObserver(fn, root) {
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
