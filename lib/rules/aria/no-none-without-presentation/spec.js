const message = 'use a role of "none presentation" to support older user-agents';

it('does not generate an error for a role of "presentation"', () => {
  appendToBody('<div role="presentation" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for a role of "none presentation"', () => {
  appendToBody('<div role="none presentation" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generate an error for a role of "none"', () => {
  const el = appendToBody('<div role="none" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries([message, el]);
  });
});
