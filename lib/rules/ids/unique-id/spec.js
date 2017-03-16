const message = 'id is not unique';

it('does not add an error if there is no id attribute', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if an id is empty', () => {
  const el = appendToBody('<div id />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['id should not be empty', el]);
  });
});

' \t\n\f\r'.split('').forEach((char) => {
  it(`adds an error if an id contains a space character (${char.charCodeAt(0)})`, () => {
    const el = appendToBody(`<div id="a${char}b" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['id should not contain space characters', el]);
    });
  });
});

it('adds an error if an id is not unique', () => {
  const id = uniqueId();
  const el = appendToBody(`<div id="${id}" />`);
  const el2 = appendToBody(`<div id="${id}" />`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el], [message, el2]);
  });
});

it('does not add an error if ids are unique', () => {
  appendToBody(`<div id="${uniqueId()}" />`);
  appendToBody(`<div id="${uniqueId()}" />`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not blow up if an id required escaping', () => {
  appendToBody('<div id="&quot;\\" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
