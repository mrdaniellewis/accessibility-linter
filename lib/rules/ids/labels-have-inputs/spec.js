it('adds an error for an empty for attribute', () => {
  const el = appendToBody('<label for>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['for attribute should not be empty', el]);
  });
});

it('adds an error for a for attribute containing spaces', () => {
  const el = appendToBody('<label for="xx xx">');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['for attribute should not contain spaces', el]);
  });
});

it('adds an error for labels without an associated control', () => {
  const el = appendToBody(`<label for="${uniqueId()}">`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no element can be found with id of id attribute', el]);
  });
});

it('does not add an error for labels with an associated control', () => {
  const id = uniqueId();
  appendToBody(`<label for="${id}"><input id="${id}">`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
