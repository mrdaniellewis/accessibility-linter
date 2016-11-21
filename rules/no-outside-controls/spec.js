it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('All controls should be within a form');
});

['input', 'textarea', 'select'].forEach((type) => {
  it(`adds an error if a ${type} is outside a form`, when(() => {
    el = appendToBody(`<${type} />`);
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));

  it(`does not adds an error if a ${type} is inside a form`, when(() => {
    appendToBody(`<form><${type} /></form>`);
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});
