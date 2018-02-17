describe('consoleReporter', () => {
  const { consoleReporter } = AccessibilityLinter;

  describe('info', () => {
    it('logs an info', () => {
      const spy = mock.spyOn(console, 'info').mockImplementation(() => {});
      const element = {};
      consoleReporter.info({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule');
    });

    it('logs a warn', () => {
      const spy = mock.spyOn(console, 'warn').mockImplementation(() => {});
      const element = {};
      consoleReporter.warn({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule');
    });

    it('logs an error', () => {
      const spy = mock.spyOn(console, 'error').mockImplementation(() => {});
      const element = {};
      consoleReporter.error({ message: 'message', element, rule: { name: 'rule' } });
      expect(spy).toHaveBeenCalledWith('message', element, 'rule');
    });
  });
});
