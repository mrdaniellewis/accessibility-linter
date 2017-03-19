const message = 'legends must be the first child of a fieldset';

it('adds an error if a legend is not in a fieldset', () => {
  const el = appendToBody('<legend>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('adds an error if a legend is not the first child of a fieldset', () => {
  const el = appendToBody(`
    <fieldset>
      <p>Lorem ispum</p>
      <legend>legend</legend>
    </fieldset>
  `).querySelector('legend');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el]);
  });
});

it('does not an error if a legend is the first child of a fieldset', () => {
  appendToBody(`
    <fieldset>
      <legend>legend</legend>
      Lorem ispum
    </fieldset>
  `).querySelector('legend');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});
