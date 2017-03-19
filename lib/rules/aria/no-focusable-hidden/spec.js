const message = 'do not mark focusable elements with `aria-hidden="true"`';

it('does not generate an error for not focusable', () => {
  appendToBody('<div aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for hidden elements', () => {
  appendToBody('<input style="display: none;" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for a hidden input', () => {
  appendToBody('<input type="hidden" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for a placeholder link', () => {
  appendToBody('<a aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for a placeholder area', () => {
  appendToBody('<area aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

['input', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  it(`does generate an error for <${name}>`, () => {
    const el = appendToBody(`<${name} aria-hidden="true"></${name}>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });
});

it('does generate an error for an element with a tabindex', () => {
  const el = appendToBody('<div tabindex="-1" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does generate an error for an anchor with a href', () => {
  const el = appendToBody('<a href="#" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does generate an error for an area with a href', () => {
  const el = appendToBody('<area href="#" aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});
