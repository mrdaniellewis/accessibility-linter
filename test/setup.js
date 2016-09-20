(function () {
  /**
   * Sets up beforeEach and afterEach functions that will amend the DOM
   * and wait for a mutation before running the suite.
   * After the tests are run the additions will be removed.
   *
   * @param {Function} fn A function that amends the DOM
   */
  const whenDomChanges = window.whenDomChanges = function whenDomChanges(fn) {
    return new Promise(resolve => {
      const observer = new MutationObserver(mutations => {
        observer.disconnect();
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
