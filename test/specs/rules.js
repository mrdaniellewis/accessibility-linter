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

  ruleSpecs.forEach((path) => {
    let window, linter, Rule, rules, iframeError;
    const name = path.replace(/\//g, '-');

    // Make sure everything is setup using the iFrame versions
    describe(name, function () {
      beforeAll(() => {
        window = context.window = frame.contentWindow;
        context.document = window.document;
        Rule = context.Rule = window.AccessibilityLinter.rules.get(name);
        rules = new Map([[name, Rule]]);
        if (!Rule) {
          throw new Error(`spec for "${name}" not found`);
        }
        window.onerror = function () {
          iframeError = true;
        };
      });

      clean(() => window);

      beforeEach(() => {
        iframeError = false;
        const logger = context.logger = new TestLogger();
        linter = context.linter = new window.AccessibilityLinter({
          logger,
          rules,
          ruleSettings: { [name]: { enabled: true, type: 'error' } },
        });
        linter.observe();
      });

      // Execute in a promise so it runs next tick after any dom mutations
      afterEach(() => Promise.resolve().then(() => {
        linter.stopObserving();
        linter = null;
        if (iframeError) {
          throw new Error('script error in iframe - see browser log');
        }
      }));

      this.requireTests(`../lib/rules/${path}/spec.js`, (content) => {
        // eslint-disable-next-line no-new-func
        new Function(`
          let Rule, logger, linter, window, document, $, appendToBody, location;

          beforeAll(() => {
            ({ window, document, window: { $, appendToBody, location } } = this);
          });

          beforeEach(() => {
            ({Rule, logger, linter} = this);
          });

          afterEach(() => {
            Rule = logger = linter = null;
          });

          ${content}
        `).call(context);
      });
    });
  });
});
