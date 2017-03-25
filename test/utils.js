/**
 * Utils to make writing tests easier
 */
(function () {
  // Generate a unique id
  let idCount = 0;
  window.uniqueId = () => `unique-id-${++idCount}`;

  const rSingleTag = /^<([a-z][^\s>]*)\s*\/?>(?:<\/\1>)?$/i;
  const rSelfClosing = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\s>]*)[^>]*)\/>/gi;
  // Build a html fragment
  // Returns an array of nodes
  function buildFragment(html) {
    html = html.trim();
    const single = rSingleTag.exec(html);
    if (single) {
      // Some nodes cannot be directly created with innerHTML, such as head and table elements
      return [document.createElement(single[1])];
    }
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    fragment.appendChild(container);
    container.innerHTML = html.replace(rSelfClosing, '<$1></$2>');
    return Array.from(container.childNodes);
  }

  // Append html to the body and return the first element
  window.appendToBody = (html) => {
    const nodes = buildFragment(html);
    nodes.forEach(node => document.body.appendChild(node));
    return nodes[0];
  };

  window.buildHtml = html => buildFragment(html)[0];

  window.domCleaner = function ({ exclude } = {}) {
    let updateCallback = null;
    const additions = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.from(mutation.addedNodes)
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
          .forEach(node => additions.push(node));

        if (updateCallback) {
          updateCallback();
        }
      });
    });

    observer.observe(
      this.document,
      { subtree: true, childList: true, attributes: true, characterData: true }
    );

    return {
      onUpdate(fn) {
        updateCallback = fn;
      },

      clear() {
        additions.splice(0);
        updateCallback = null;
      },

      clean() {
        additions.splice(0).forEach(el => el.remove());
        updateCallback = null;
      },

      stop() {
        observer.disconnect();
      },
    };
  };
}());
