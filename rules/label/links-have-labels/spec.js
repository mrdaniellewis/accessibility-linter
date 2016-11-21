it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('links must have a label');
});

it('does not add an error if a button has a text label', when(() => {
  appendToBody('<a>text</a>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if a button has a non-empty aria-label', when(() => {
  appendToBody('<a aria-label="label" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if a button has a non-empty aria-labelledby', when(() => {
  const id = uniqueId();
  appendToBody(`<span id="${id}">label</span>`);
  appendToBody(`<a aria-labelledby="${id}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error if a button has non-empty multiple aria-labelledby', when(() => {
  const id1 = uniqueId();
  const id2 = uniqueId();
  appendToBody(`<span id="${id1}">label</span>`);
  appendToBody(`<span id="${id2}">label</span>`);
  appendToBody(`<a aria-labelledby="${id1} ${id2}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a button has no label of any kind', when(() => {
  el = appendToBody('<a />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a button has an empty aria-label', when(() => {
  el = appendToBody('<a aria-label="">label</a>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a button has an empty aria-labelledby', when(() => {
  const id = uniqueId();
  appendToBody(`<span id="${id}"></span>`);
  el = appendToBody(`<a aria-label="label" aria-labelledby="${id}">label</a>`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

