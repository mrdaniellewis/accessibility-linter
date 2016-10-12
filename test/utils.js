/**
 * Utils to make writing tests easier
 */
(function () {
  let idCount = 0;
  window.uniqueId = () => `unique-id-${++idCount}`;

  // Run a function that returns a promise that will resolve
  // once the DOM has childlist mutations.
  // After the then handler has been run, remove the additions
  window.when = function when(fn) {
    const domAdditions = [];
    const promise = new Promise(resolve => {
      const observer = new MutationObserver(mutations => {
        observer.disconnect();
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => domAdditions.push(node)));
        resolve(mutations);
      });
      observer.observe(document, { subtree: true, childList: true });
      fn();
    });

    promise.then = test => Promise.prototype.then.call(promise, test)
      .then(() => {
        domAdditions.splice(0).forEach(el => el.remove());
      });

    return promise;
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
}());
