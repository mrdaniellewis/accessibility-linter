it('does not add an error if an input is linked to a valid datalist', when(() => {
  const id = uniqueId();
  appendToBody(`<input list="${id}"><datalist id="${id}"><datalist />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if the list attribute is empty', when(() => {
  el = appendToBody('<input list>');
}).then(() => {
  expect(logger).toHaveEntries(['no datalist found', el]);
}));

it('adds an error if the list is missing', when(() => {
  const id = uniqueId();
  el = appendToBody(`<input list="${id}">`);
}).then(() => {
  expect(logger).toHaveEntries(['no datalist found', el]);
}));

it('does not blow up if the id is invalid', when(() => {
  el = appendToBody('<input list="&quot; \\">');
}).then(() => {
  expect(logger).toHaveEntries(['no datalist found', el]);
}));
