const message = 'use a role of "none presentation" to support older user-agents';

it('does not generate an error for a role of "presentation"', when(() => {
  appendToBody('<div role="presentation" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for a role of "none presentation"', when(() => {
  appendToBody('<div role="none presentation" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does generate an error for a role of "none"', when(() => {
  el = appendToBody('<div role="none" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
