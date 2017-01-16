/**
 * Utils to make writing tests easier
 */
(function () {
  // Generate a unique id
  let idCount = 0;
  window.uniqueId = () => `unique-id-${++idCount}`;

  // Append html to the body and return the first element
  window.appendToBody = html => $(html).appendTo('body')[0];

  window.build = html => $(html)[0];

  window.domCleaner = function ({ exclude } = {}) {
    const additions = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(
        mutation => Array.from(mutation.addedNodes)
          .filter((node) => {
            if (!exclude) {
              return true;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
              return !node.matches(exclude);
            }
            if (node.parentNode) {
              return !node.parentNode.matches(exclude);
            }
            return true;
          })
          .forEach(node => additions.push(node))
      );
    });

    observer.observe(this.document, { subtree: true, childList: true });

    return {
      clean() {
        additions.splice(0).forEach(el => el.remove());
      },

      stop() {
        observer.disconnect();
      },
    };
  };
}());