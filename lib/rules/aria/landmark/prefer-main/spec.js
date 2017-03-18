const message = 'use a main element for role=main';

it('does not generate an error for a main element', () => {
  appendToBody('<main />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for a main element with a role of main', () => {
  appendToBody('<main role="main" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('generates an error for an element with a role of main', () => {
  const el = appendToBody('<div role="main" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('generates an error for an element with a role of main with a fallback role', () => {
  const el = appendToBody('<div role="main button" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not generate an error where main is a fallback role', () => {
  appendToBody('<div role="button main" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
