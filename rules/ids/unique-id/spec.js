it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('id is not unique');
});

it('adds an error if an id is not unique', when(() => {
  const id = uniqueId();
  el = appendToBody(`<div id="${id}" />`);
  el2 = appendToBody(`<div id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el], [rule, el2]);
}));

it('does not add an error if ids are unique', when(() => {
  appendToBody(`<div id="${uniqueId()}" />`);
  appendToBody(`<div id="${uniqueId()}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('ignores empty ids', when(() => {
  appendToBody('<div id />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('includes hidden elements', when(() => {
  const id = uniqueId();
  el = appendToBody(`<div aria-hidden="true" id="${id}" />`);
  el2 = appendToBody(`<div id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el], [rule, el2]);
}));

it('does not blow up if an id required escaping', when(() => {
  appendToBody('<div id="&quot; \\" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
