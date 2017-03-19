const message = 'use a button instead of a link';

it('does not add an error for a normal link', () => {
  appendToBody('<a href="/foo">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if a link with role button is used', () => {
  const el = appendToBody('<a role="button">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('adds an error if a link has an empty fragment', () => {
  const el = appendToBody('<a href="#">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('adds an error if a link uses the javascript protocol', () => {
  const el = appendToBody('<a href="javascript:print()">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not add an error for a hidden link', () => {
  appendToBody('<a href="#" style="display: none;">foo</a>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
