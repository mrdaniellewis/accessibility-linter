// Rules are run in an iframe so mocha display does not interfere
describe('rules', () => {
  AccessibilityLinter.rules.forEach((Rule) => {
    describe(Rule.name, () => {
      // eslint-disable-next-line no-new-func
      if (!ruleSpecs.get(Rule.name)) {
        it('has a spec', () => {
          throw new Error('missing spec');
        });
      } else {
        const context = {};
        let domWaiter;

        beforeEach(() => {
          const reporter = { error: mock.fn() };
          const linter = new AccessibilityLinter({
            rateLimit: -1,
            reporters: [reporter],
            rules: [new Rule({ type: 'error' })],
            observers: Object.values(AccessibilityLinter.observers),
          });
          linter.observe();
          Object.assign(context, { linter, Rule, reporter });
          domWaiter = createDomWaiter({ whitelist: 'body' });
          context.domChange = domWaiter.promise;
        });

        afterEach(() => {
          context.linter.disconnect();
          domWaiter.stop();
          domWaiter = null;
          Object.keys(context).forEach(key => delete context[key]);
        });

        // eslint-disable-next-line no-new-func
        new Function('Rule', `
          let domChange, linter, reporter;
          beforeEach(() => {
            ({ domChange, linter, reporter } = this);
          });
          ${ruleSpecs.get(Rule.name)}
        `).call(context, Rule);
      }
    });
  });
});
