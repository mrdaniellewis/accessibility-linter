const message = 'do not use the address element';

it('generates an error for the address element', when(() => {
  el = appendToBody('<address />');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));

it('generates an error for hidden the address elements', when(() => {
  el = appendToBody('<address style="display: none;"/>');
}).then(() => {
  expect(logger).toHaveEntries([message, el]);
}));
