describe('support', function () {
  it('is a property of AccessibilityLinter', () => {
    expect(AccessibilityLinter.Utils).toExist();
  });

  this.requireTests('specs/utils/selectors.js');
  this.requireTests('specs/utils/style.js');
  this.requireTests('specs/utils/hidden.js');
  this.requireTests('specs/utils/text-alternatives.js');
  this.requireTests('specs/utils/aria.js');
  this.requireTests('specs/utils/contrast.js');
});
