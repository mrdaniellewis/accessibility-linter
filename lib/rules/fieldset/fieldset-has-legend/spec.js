it('adds an error if a fieldset is empty', () => {
  const el = appendToBody('<fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['All fieldsets must have a legend', el]);
  });
});

it('adds an error if a fieldset does not have a legend', () => {
  const el = appendToBody('<fieldset><div>Lorem ipsum</div></fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['All fieldsets must have a legend', el]);
  });
});

it('adds an error if a fieldset has a legend that is not the first child', () => {
  const el = appendToBody(`<fieldset>
    <div>Lorem ipsum</div>
    <legend>legend</legend>
  </fieldset>`);
  return whenDomUpdates(() => {
    expect(logger).toHaveEntries(['All fieldsets must have a legend', el]);
  });
});

it('does not add an error if the fieldset has a legend as the first child', () => {
  appendToBody('<fieldset><legend>legend</legend></fieldset>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
