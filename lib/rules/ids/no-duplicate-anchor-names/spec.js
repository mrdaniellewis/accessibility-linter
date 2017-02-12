const message = 'name is not unique';

it('adds an error if a name is empty', when(() => {
  el = appendToBody('<a name />');
}).then(() => {
  expect(logger).toHaveEntries(['name should not be empty', el]);
}));

it('adds an error if a name does not equal the id', when(() => {
  const id = uniqueId();
  const name = uniqueId();
  el = appendToBody(`<a name="${name}" id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries(['if the id attribute is present it must equal the name attribute', el]);
}));

it('does not add an error if a name equals the id', when(() => {
  const name = uniqueId();
  el = appendToBody(`<a name="${name}" id="${name}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a name is not unique', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a name="${id}" />`);
  el2 = appendToBody(`<a name="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('it includes hidden elements', when(() => {
  const id = uniqueId();
  el = appendToBody(`<a aria-hidden="true" name="${id}" />`);
  el2 = appendToBody(`<a name="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
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
  expect(logger).toHaveEntries([message, el]);
}));

it('does not blow up if the name requires escaping', when(() => {
  appendToBody('<a name="&quot; \\" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not add an error for non-anchor elements', when(() => {
  el = appendToBody('<div name />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

