const message = 'id is not unique';

it('does not add an error if there is no id attribute', when(() => {
  el = appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if an id is empty', when(() => {
  el = appendToBody('<div id />');
}).then(() => {
  expect(logger).toHaveEntries(['id should not be empty', el]);
}));

' \t\n\f\r'.split('').forEach((char) => {
  it(`adds an error if an id contains a space character (${char.charCodeAt(0)})`, when(() => {
    el = appendToBody(`<div id="a${char}b" />`);
  }).then(() => {
    expect(logger).toHaveEntries(['id should not contain space characters', el]);
  }));
});

it('adds an error if an id is not unique', when(() => {
  const id = uniqueId();
  el = appendToBody(`<div id="${id}" />`);
  el2 = appendToBody(`<div id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('does not add an error if ids are unique', when(() => {
  appendToBody(`<div id="${uniqueId()}" />`);
  appendToBody(`<div id="${uniqueId()}" />`);
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('includes hidden elements', when(() => {
  const id = uniqueId();
  el = appendToBody(`<div aria-hidden="true" id="${id}" />`);
  el2 = appendToBody(`<div id="${id}" />`);
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('does not blow up if an id required escaping', when(() => {
  appendToBody('<div id="&quot;\\" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
