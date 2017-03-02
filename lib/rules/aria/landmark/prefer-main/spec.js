const message = 'use a main element for role=main';

it('it does not generate an error for a main element', when(() => {
  el = appendToBody('<main />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not generate an error for a main element with role=main', when(() => {
  el = appendToBody('<main role="main" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it generates an error for an element that is not main with a role of main', when(() => {
  el = appendToBody('<div role="main" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('generates an error for hidden elements', when(() => {
  el = appendToBody('<div role="main" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
