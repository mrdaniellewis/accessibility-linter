mocha.setup('bdd');

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
afterEach(() => mock.clearAllMocks());

window.nextTick = (wait = 0) => new Promise(resolve => setTimeout(resolve, wait));
