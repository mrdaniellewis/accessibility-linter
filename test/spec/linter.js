describe('Linter', () => {
  it('is a property of window', () => {
    expect(AccessibilityLinter).toBeInstanceOf(Function);
  });

  describe('.version', () => {
    it('is a version number', () => {
      expect(AccessibilityLinter.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
