(function () {
  /**
   * Sets up beforeEach and afterEach functions that will amend the DOM
   * and wait for a mutation before running the suite.
   * After the tests are run the additions will be removed.
   *
   * @param {Function} fn A function that amends the DOM
   */
  function whenDomChanges(fn, before, after) {
    const additions = [];

    before(() => new Promise(resolve => {
      const observer = new MutationObserver(mutations => {
        additions.concat(mutations.map(mutation => Array.from(mutation.addedNodes)));
        observer.disconnect();
        resolve();
      });
      observer.observe(document, { subtree: true, childList: true });
      fn();
    }));

    after(() => {
      // Remove added DOM nodes
      additions.splice(0).forEach(node => node.remove());
    });
  }

  window.changeDomBeforeAll = fn => whenDomChanges(fn, before, after);
  window.changeDomBeforeEach = fn => whenDomChanges(fn, beforeEach, afterEach);

  expect.extend({
    toBeEmpty() {
      expect.assert(
        this.length === 0,
        'expected %s to have no logged entries',
        this.length
      );
      return this;
    },

    toHaveEntries(entries) {
      const array = Array.from(this);
      return expect(array).toEqual(entries);
    },
  });
}());
