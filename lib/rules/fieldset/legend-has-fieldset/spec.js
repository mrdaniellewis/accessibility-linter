it('adds an error if a legend is not in a fieldset', when(() => {
  el = appendToBody('<legend>');
}).then(() => {
  expect(logger).toHaveEntries(['All legends must be the first child of a fieldset', el]);
}));

it('adds an error if a legend is not the first child of a fieldset', when(() => {
  el = appendToBody(`
    <fieldset>
      <p>Lorem ispum</p>
      <legend>legend</legend>
    </fieldset>
  `).querySelector('legend');
}).then(() => {
  expect(logger).toHaveEntries(['All legends must be the first child of a fieldset', el]);
}));

it('does not an error if a legend is the first child of a fieldset', when(() => {
  el = appendToBody(`
    <fieldset>
      <legend>legend</legend>
      Lorem ispum
    </fieldset>
  `).querySelector('legend');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
