it('does not add an error if an input is linked to a valid datalist', () => {
  const id = uniqueId();
  appendToBody(`<input list="${id}"><datalist id="${id}"><datalist />`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if the list attribute is empty', () => {
  const el = appendToBody('<input list>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no datalist found', el]);
  });
});

it('adds an error if the list is missing', () => {
  const id = uniqueId();
  const el = appendToBody(`<input list="${id}">`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no datalist found', el]);
  });
});

it('does not blow up if the id is invalid', () => {
  const el = appendToBody('<input list="&quot; \\">');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no datalist found', el]);
  });
});
