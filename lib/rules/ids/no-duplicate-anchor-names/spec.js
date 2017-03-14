const message = 'name is not unique';

it('adds an error if a name is empty', () => {
  const el = appendToBody('<a name />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['name should not be empty', el]);
  });
});

it('adds an error if a name does not equal the id', () => {
  const id = uniqueId();
  const name = uniqueId();
  const el = appendToBody(`<a name="${name}" id="${id}" />`);
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['if the id attribute is present it must equal the name attribute', el]);
  });
});

it('does not add an error if a name equals the id', () => {
  const name = uniqueId();
  appendToBody(`<a name="${name}" id="${name}" />`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if a name is not unique', () => {
  const id = uniqueId();
  const el = appendToBody(`<a name="${id}" />`);
  const el2 = appendToBody(`<a name="${id}" />`);
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el], [message, el2]);
  });
});

it('it includes hidden elements', () => {
  const id = uniqueId();
  const el = appendToBody(`<a aria-hidden="true" name="${id}" />`);
  const el2 = appendToBody(`<a name="${id}" />`);
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el], [message, el2]);
  });
});

it('does not add an error if name is unique', () => {
  appendToBody(`<a name="${uniqueId()}" />`);
  appendToBody(`<a name="${uniqueId()}" />`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if a name is shared by an id', () => {
  const id = uniqueId();
  const el = appendToBody(`<a name="${id}" />`);
  appendToBody(`<a id="${id}" />`);
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});

it('does not blow up if the name requires escaping', () => {
  appendToBody('<a name="&quot; \\" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for non-anchor elements', () => {
  appendToBody('<div name />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

