mocha.setup('bdd');

// Helpful shortcut
window.appendToBody = domUtils.appendToBody;
window.uniqueId = domUtils.uniqueId;

// Remove any created DOM nodes
domUtils.cleanDom();
// Ensure each test has expectations
expect.hasAssertions();
// Clean up spies
afterEach(() => mock.clearAllMocks());
