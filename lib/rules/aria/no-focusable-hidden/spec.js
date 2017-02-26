const message = 'do not mark focusable elements with `aria-hidden="true"`';

it('does not generate an error for not focusable', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for hidden elements', when(() => {
  appendToBody('<input style="display: none;" aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for a hidden input', when(() => {
  appendToBody('<input type="hidden" aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for a placeholder link', when(() => {
  appendToBody('<a aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for a placeholder area', when(() => {
  appendToBody('<area aria-hidden="true" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

['input', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  it(`does generate an error for <${name}>`, when(() => {
    el = appendToBody(`<${name} aria-hidden="true"></${name}>`);
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));
});

it('does generate an error for an element with a tabindex', when(() => {
  el = appendToBody('<div tabindex="-1" aria-hidden="true" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('does generate an error for an anchor with a href', when(() => {
  el = appendToBody('<a href="#" aria-hidden="true" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('does generate an error for an area with a href', when(() => {
  el = appendToBody('<area href="#" aria-hidden="true" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
