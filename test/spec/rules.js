// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  const context = {};
  let iframeError;
  let frame;

  beforeAll((done) => {
    frame = document.createElement('iframe');
    frame.src = 'frame.htm';
    frame.style = 'border: 0; height: 0; width: 0;';
    document.body.appendChild(frame);
    frame.contentWindow.addEventListener('load', () => {
      context.window = frame.contentWindow;
      context.document = window.document;
      context.window.onerror = function onerror() {
        iframeError = true;
      };
      done();
    });
  }, 10e3);

  afterAll(() => {
    Object.keys(context, key => (context[key] = null));
    frame.remove();
  });

  beforeEach(() => {
    iframeError = false;
  });

  domUtils.cleanDom({ context: () => context.window });

  afterEach(async () => {
    await Promise.resolve();
    if (iframeError) {
      throw new Error('script error in iframe - see browser log');
    }
  });

  function ruleRunner(ruleName) {
    let AccessibilityLinter;
    let linter; // eslint-disable-line no-unused-vars
    let document; // eslint-disable-line no-unused-vars
    let Rule;
    let window;

    beforeAll(() => {
      ({ window, document } = this);
      ({ AccessibilityLinter, appendToBody, uniqueId } = window); // eslint-disable-line no-global-assign, max-len
    });

    beforeEach(() => {
      Rule = AccessibilityLinter.rules.get(ruleName);
      if (!Rule) {
        throw new Error(`rule with name "${ruleName}" not found`);
      }
      linter = new AccessibilityLinter({
        rules: [new Rule({ type: 'error' })],
        observers: Object.values(AccessibilityLinter.observers),
      });
      linter.observe();
    });

    afterEach(() => {
      linter.disconnect();
      Rule = null;
      AccessibilityLinter = null;
      linter = null;
    });
  }

  AccessibilityLinter.rules.forEach((Rule, ruleName) => {
    describe(ruleName, () => {
      beforeAll(() => {
        context.ruleName = ruleName;
      });

      // The spec needs to be run in a context where DOM globals point to the iframe
      // rather than those of the current window.
      // eslint-disable-next-line no-new-func
      new Function('ruleName', `
        ${ruleRunner.toString().split('\n').slice(1, -1).join('\n')}
        ${ruleSpecs.get(ruleName) || "it('has a spec', () => { throw new Error('missing spec'); });"}
      `).call(context, ruleName);
    });
  });
});
