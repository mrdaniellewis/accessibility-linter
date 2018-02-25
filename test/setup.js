// mocha.setup('bdd');
mocha.setup({ ui: 'bdd', reporter: window.ConsoleReporter });

window.addEventListener('load', () => {
  mocha.checkLeaks();
  mocha.run();
});

// Helpful shortcut
window.appendToBody = domUtils.appendToBody;
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
