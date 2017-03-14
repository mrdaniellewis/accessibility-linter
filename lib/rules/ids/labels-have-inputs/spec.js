it('adds an error for labels without a for attribute', () => {
  const el = appendToBody('<label>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['all labels must be linked to a control', el]);
  });
});

it('adds an error for labels without an associated control', () => {
  const el = appendToBody(`<label for="${uniqueId()}">`);
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['all labels must be linked to a control', el]);
  });
});

it('does not add an error for labels with an associated control', () => {
  const id = uniqueId();
  appendToBody(`<label for="${id}"><input id="${id}">`);
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
