const message = 'all buttons should have a type attribute';

it('does not generate an error message with a type attribute', () => {
  appendToBody('<button type="button" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('generates an error message without a type attribute', () => {
  const el = appendToBody('<button />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
