// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  const context = {};
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

  AccessibilityLinter.rules.forEach((rule, name) => {
    describe(name, () => {
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
        // start linter
      });

      // Execute in a promise so it runs next tick after any dom mutations
      afterEach(() => Promise.resolve().then(() => {
        // Stop linter
        if (iframeError) {
          throw new Error('script error in iframe - see browser log');
        }
      }));

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

        ${ruleSpecs.default.get(name) || "it('has a spec', () => { throw new Error('missing spec'); });"}

      `).call(context);
    });
  });
});
