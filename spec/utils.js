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

  window.domCleaner = function () {
    const additions = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(
        mutation => mutation.addedNodes.forEach(
          node => additions.push(node)
        )
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
