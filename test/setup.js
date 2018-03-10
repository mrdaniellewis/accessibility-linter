// mocha.setup('bdd');
mocha.setup({ ui: 'bdd', reporter: window.ConsoleReporter });

window.addEventListener('load', () => {
  mocha.checkLeaks();
  mocha.run();
});

// Helpful shortcut
window.appendToBody = domUtils.appendToBody;
window.buildHtml = domUtils.buildHtml;
window.uniqueId = domUtils.uniqueId;
window.beforeAll = before;
window.afterAll = after;

// Remove any created DOM nodes
domUtils.cleanDom();
// Ensure each test has expectations
expect.hasAssertions();
// Clean up spies
afterEach(() => mock.restoreAllMocks());

window.nextTick = (wait = 0) => new Promise(resolve => setTimeout(resolve, wait));

expect.extend({
  toHaveErrors(received, ...expected) {
    const logged = [].concat(...received.error.mock.calls.map(args => (
      args.map(({ message, element }) => ({ message, element }))
    )));
    if (this.isNot) {
      expect(logged).toEqual([]);
      return { pass: false };
    }
    if (expected.length === 0) {
      expect(logged.length).toBeGreaterThan(0);
    } else {
      expect(logged).toEqual(expected);
    }
    return { pass: true };
  },
});

window.createDomWaiter = function createDomWaiter() {
  let stop;
  const promise = new Promise((resolve) => {
    const observer = new MutationObserver(() => resolve());
    observer.observe(
      document,
      { subtree: true, childList: true, attributes: true, characterData: true },
    );
    stop = () => {
      observer.disconnect();
    };
  });

  return {
    promise,
    stop,
  };
};
