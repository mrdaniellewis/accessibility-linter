(function () {
  /**
   * Sets up beforeEach and afterEach functions that will amend the DOM
   * and wait for a mutation before running the suite.
   * After the tests are run the additions will be removed.
   *
   * @param {Function} fn A function that amends the DOM
   */
  const whenDomChanges = window.whenDomChanges = function whenDomChanges(fn) {
    const additions = window.domAdditions = window.domAdditions || [];

    return new Promise(resolve => {
      const observer = new MutationObserver(mutations => {
        observer.disconnect();
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => additions.push(node)));
        resolve(mutations);
      });
      observer.observe(document, { subtree: true, childList: true });
      fn();
    });
  };

  function setupDomChange(fn, before, after) {
    const additions = [];

    before(() => (
      whenDomChanges(fn)
        .then(mutations => {
          mutations.forEach(mutation => mutation.addedNodes.forEach(node => additions.push(node)));
          return mutations;
        })
    ));

    after(() => {
      additions.forEach(el => el.remove());
    });
  }

  window.setupDomChangeBeforeAll = fn => setupDomChange(fn, before, after);
  window.changeDomBeforeEach = fn => setupDomChange(fn, beforeEach, afterEach);

  window.appendElement = (name, attrs = {}, text) => {
    const created = document.createElement(name);
    Object.keys(attrs).forEach(key => {
      created.setAttribute(key, attrs[key]);
    });
    if (text) {
      created.appendChild(document.createTextNode(text));
    }
    document.body.appendChild(created);
    return created;
  };

  let idCount = 0;
  window.uniqueId = () => `unique-id-${++idCount}`;

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
