const message = 'there should only be one element with a role of contentinfo in each document or application';

// As this inherits from one-banner only a limited number of tests are required

it('does not generate an error for one footer', () => {
  appendToBody('<footer />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for one element with the role contentinfo', () => {
  appendToBody('<div role="contentinfo" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does generate an error for more than one contentinfo', () => {
  const el1 = appendToBody('<div role="contentinfo" />');
  const el2 = appendToBody('<footer />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      [message, el1],
      [message, el2]
    );
  });
});

it('does generate an error if the second footer is for a section', () => {
  appendToBody('<footer />');
  appendToBody('<section><footer /></section>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error if contentinfo  is not the primary role', () => {
  appendToBody('<div role="button contentinfo" />');
  appendToBody('<footer />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
