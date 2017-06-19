describe('#allowedAria', () => {
  let allowedAria;
  beforeEach(() => {
    allowedAria = new AccessibilityLinter.Config().allowedAria;
  });

  it('has a property for each non-obsolete element', () => {
    const elements = testData.allElements.filter(name => !testData.obsoleteElements.includes(name));
    expect(Object.keys(allowedAria).filter(name => name !== '_default')).toMatchArray(elements);
  });

  // This is tested in utils#allowed
});
