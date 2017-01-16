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
    let window, rule, rules, cleaner;

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
        window.onerror = function (message) {
          throw new Error(`Error in iframe ${message}`);
        };
      });

      beforeEach(() => {
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
      }));

      spec.call(context);
    });
  });
});
