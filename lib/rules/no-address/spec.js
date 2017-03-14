const message = 'do not use the address element';

it('generates an error for the address element', () => {
  const el = appendToBody('<address />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});

it('generates an error for hidden the address elements', () => {
  const el = appendToBody('<address style="display: none;"/>');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
