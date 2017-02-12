// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  const context = { when };
  let frame;

  before((done) => {
    frame = document.createElement('iframe');
    frame.src = 'frame.htm';
    frame.style = 'border: 0; height: 0; width: 0;';
    document.body.appendChild(frame);
    frame.contentWindow.addEventListener('load', () => done());
  });

  after(() => {
    frame.remove();
  });

  ruleSpecs.forEach((spec, name) => {
    let window, rule, rules, cleaner, iframeError;

    // Make sure everything is setup using the iFrame versions
    describe(name, () => {
      before(() => {
        window = context.window = frame.contentWindow;
        context.document = window.document;
        rule = context.rule = window.AccessibilityLinter.rules.get(name);
        rules = new Map([[name, rule]]);
        if (!rule) {
          throw new Error(`spec for "${name}" not found`);
        }
        window.onerror = function () {
          iframeError = true;
        };
      });

      beforeEach(() => {
        iframeError = false;
        const logger = context.logger = new TestLogger();
        const linter = context.linter = new window.AccessibilityLinter({ logger, rules });
        linter.observe();
        cleaner = window.domCleaner();
      });

      // Execute in a promise so it runs next tick after any dom mutations
      afterEach(() => Promise.resolve().then(() => {
        cleaner.stop();
        cleaner.clean();
        cleaner = null;
        if (iframeError) {
          throw new Error('script error in iframe - see browser log');
        }
      }));

      // eslint-disable-next-line no-new-func
      new Function(`
        let el, el2, rule, logger, linter, window, document, $, appendToBody, location;
        const when = fn => this.when(fn, this);

        before(() => {
          ({ window, document, window: { $, appendToBody, location } } = this);
        });

        beforeEach(() => {
          ({rule, logger, linter} = this);
        });

        afterEach(() => {
          el = el2 = rule = logger = linter = null;
        });

        ${spec.toString().replace(/^function\s*\(\)\s*{/, '').replace(/}$/, '')}
      `).call(context);
    });
  });
});
