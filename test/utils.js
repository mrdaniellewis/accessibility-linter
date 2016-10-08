/**
 * Utils to make writing tests easier
 */

// Find an element by a selector
window.$ = (selector, context = document) => context.querySelector(selector);

// Find elements by a selector
window.$$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Create an element
window.create = (name, attrs) => {
  const created = document.createElement(name);
  Object.keys(attrs).forEach(key => {
    created.setAttribute(key, attrs[key]);
  });
};

window.domAdditions = [];
window.whenDomChanges = function whenDomChanges(fn) {
  return new Promise(resolve => {
    const additions = window.domAdditions;
    const observer = new MutationObserver(mutations => {
      observer.disconnect();
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => additions.push(node)));
      resolve(mutations);
    });
    observer.observe(document, { subtree: true, childList: true });
    fn();
  });
};

window.TestLogger = class {
  constructor() {
    this.clear();
  }

  error() {
    this.errors.push(Array.from(arguments));
  }

  clear() {
    this.errors = [];
  }
};
