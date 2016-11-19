it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('All legends must be the first child of a fieldset');
});

it('adds an error if a legend is not in a fieldset', when(() => {
  el = appendToBody('<legend>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a legend is not the first child of a fieldset', when(() => {
  appendToBody(`
    <fieldset>
      <p>Lorem ispum</p>
      <legend>legend</legend>
    </fieldset>
  `);
  el = $('legend')[0];
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not an error if a legend is the first child of a fieldset', when(() => {
  appendToBody(`
    <fieldset>
      <legend>legend</legend>
      Lorem ispum
    </fieldset>
  `);
  el = $('legend')[0];
}).then(() => {
  expect(logger).toNotHaveEntries();
}));
