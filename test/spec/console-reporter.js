describe('consoleReporter', () => {
  const { consoleReporter } = AccessibilityLinter;
  const packageJson = fetch('../package.json').then(response => response.json());

  describe('info', () => {
    it('logs an info', async () => {
      const spy = mock.spyOn(console, 'info').mockImplementation(() => {});
      const element = {};
      consoleReporter.info({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule', `${(await packageJson).docUrl}#rule`);
    });

    it('logs a warn', async () => {
      const spy = mock.spyOn(console, 'warn').mockImplementation(() => {});
      const element = {};
      consoleReporter.warn({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule', `${(await packageJson).docUrl}#rule`);
    });

    it('logs an error', async () => {
      const spy = mock.spyOn(console, 'error').mockImplementation(() => {});
      const element = {};
      consoleReporter.error({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule', `${(await packageJson).docUrl}#rule`);
    });
  });
});
