it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('Name is not unique');
});

it('adds an error if a name is empty', when(() => {
  el = appendToBody('<a name />');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a name is not unique', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a name="${id}" />`);
  el2 = appendToBody(`<a name="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el], [rule, el2]);
}));

it('it includes hidden elements', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a aria-hidden="true" name="${id}" />`);
  el2 = appendToBody(`<a name="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el], [rule, el2]);
}));

it('does not add an error if name is unique', when(() => {
  appendToBody(`<a name="${uniqueId()}" />`);
  appendToBody(`<a name="${uniqueId()}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a name is shared by an id', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a name="${id}" />`);
  appendToBody(`<a id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not blow up if the name requires escaping', when(() => {
  appendToBody('<a name="&quot; \\" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
