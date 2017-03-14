const message = 'data is an attribute prefix';

it('does not an error for element with allowed attributes', () => {
  appendToBody('<div data-foo="bar" data-fee="foo" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for element with a "data" attribute', () => {
  const el = appendToBody('<div data="bar" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});

it('adds an error for element with a "data-" attribute', () => {
  const el = appendToBody('<div data-="bar" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
