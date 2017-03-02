const message = 'there should only be one element with a role of banner';

it('it does not generate an error for one header element', when(() => {
  el = appendToBody('<main />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('it does not generate an error for one element with a role of main', when(() => {
  el = appendToBody('<div role="main" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('generates an error for two main elements', when(() => {
  el = appendToBody('<main />');
  el2 = appendToBody('<main />');
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('generates an error for two elements with a role of main', when(() => {
  el = appendToBody('<div role="main" />');
  el2 = appendToBody('<div role="main" />');
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('generates an error for mixed role and main', when(() => {
  el = appendToBody('<div role="main" />');
  el2 = appendToBody('<main />');
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));

it('generates an error for hidden elements', when(() => {
  el = appendToBody('<main style="display: none" />');
  el2 = appendToBody('<main />');
}).then(() => {
  expect(logger).toHaveEntries([message, el], [message, el2]);
}));
