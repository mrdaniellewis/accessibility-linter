beforeEach(() => {
  linter.config.attributes.eventHandlerAttributes = ['onfoo', 'onbar', 'onfoe'];
});

it('does not add an error for an unknown attribute', () => {
  appendToBody('<div onthumb="alert(\'hello\')" />');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for an event handler', () => {
  const el = appendToBody('<div onFoo="alert(\'hello\')" />');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not use event handler attributes. Found: onfoo', el]);
  });
});

it('adds an error for a multiple event handlers', () => {
  const el = appendToBody('<div onFoo="alert(\'hello\')" onBar="alert(\'hello\')" />');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not use event handler attributes. Found: onfoo, onbar', el]);
  });
});
