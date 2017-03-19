const message = 'missing alt attribute';

it('adds an error for images without an alt tag', () => {
  const el = appendToBody('<img>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error for images with an alt tag', () => {
  appendToBody('<img alt="foo">');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for images with an empty alt tag', () => {
  appendToBody('<img alt="">');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
