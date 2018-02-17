// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  let frame;

  beforeAll((done) => {
    frame = document.createElement('iframe');
    frame.src = 'frame.htm';
    frame.style = 'border: 0; height: 0; width: 0;';
    document.body.appendChild(frame);
    frame.contentWindow.addEventListener('load', () => done());
  });

  afterAll(() => {
    frame.remove();
  });

  AccessibilityLinter.rules.forEach((Rule) => {
    describe(Rule.name, () => {
      const context = {};
      let iframeError;

      beforeAll(() => {
        context.window = frame.contentWindow;
        context.document = window.document;
        context.window.onerror = function onerror() {
          iframeError = true;
        };
      });

      beforeEach(() => {
        iframeError = false;
        context.Rule = Rule;
        // start linter and add to context
      });

      // Execute in a promise so it runs next tick after any dom mutations
      afterEach(() => Promise.resolve().then(() => {
        // Stop linter and clear context
        if (iframeError) {
          throw new Error('script error in iframe - see browser log');
        }
      }));

      // The spec needs to be run in a context where DOM globals point to the iframe
      // rather than those of the current window.
      // eslint-disable-next-line no-new-func
      new Function(`
        let Rule, window, document;

        beforeAll(() => {
          ({ window, document } = this);
        });

        beforeEach(() => {
          ({ Rule } = this);
        });

        afterEach(() => {
          Rule = null;
        });

        ${ruleSpecs.default.get(Rule.name) || "it('has a spec', () => { throw new Error('missing spec'); });"}
      `).call(context);
    });
  });
});
