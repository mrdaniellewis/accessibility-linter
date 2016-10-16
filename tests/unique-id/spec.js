let el2;

it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('id is not unique');
});

it('adds an error if an id is not unique', when(() => {
  const id = uniqueId();
  el = appendToBody(`<div id="${id}" />`);
  el2 = appendToBody(`<div id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([test, el], [test, el2]);
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

it('does not blow up if ids required escaping', when(() => {
  appendToBody('<div id="&quot; \\" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
