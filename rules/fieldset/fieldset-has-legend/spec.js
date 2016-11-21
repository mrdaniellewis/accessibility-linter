it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('All fieldsets must have a legend');
});

it('adds an error if a fieldset is empty', when(() => {
  el = appendToBody('<fieldset>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a fieldset does not have a legend', when(() => {
  el = appendToBody('<fieldset><div>Lorem ipsum</div></fieldset>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('adds an error if a fieldset has a legend that is not the first child', when(() => {
  el = appendToBody(`<fieldset>
    <div>Lorem ipsum</div>
    <legend>legend</legend>
  </fieldset>`);
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));

it('does not add an error if the fieldset has a legend as the first child', when(() => {
  el = appendToBody('<fieldset><legend>legend</legend></fieldset>');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('adds an error if a fieldset has a legend that is empty', when(() => {
  el = appendToBody('<fieldset><legend></legend></fieldset>');
}).then(() => {
  expect(logger).toHaveEntries([rule, el]);
}));