const message = 'there should only be one element with a role of main in each document or application';

// As this inherits from one-banner only a limited number of tests are required

it('does not generate an error for one main', () => {
  appendToBody('<main />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for one element with the role main', () => {
  appendToBody('<div role="main" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generate an error for more than one main', () => {
  const el1 = appendToBody('<div role="main" />');
  const el2 = appendToBody('<main />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el1],
      [message, el2]
    );
  });
});

it('does not generate an error if main is not the primary role', () => {
  appendToBody('<div role="button main" />');
  appendToBody('<main />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
