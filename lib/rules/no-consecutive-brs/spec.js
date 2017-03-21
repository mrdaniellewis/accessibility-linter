const message = 'do not use <br>s for spacing';

it('does not add an error for a single <br>', () => {
  appendToBody('<br>');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for hidden <br>', () => {
  appendToBody('<br><br style="display: none">');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error for br with text between', () => {
  appendToBody('<br>foo<br>');

  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for consecutive brs', () => {
  const el = appendToBody('<br><br><br>');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el.nextSibling.nextSibling]);
  });
});

it('adds an error for consecutive brs separated by white space', () => {
  const el = appendToBody('<br> <br> <br>');

  return whenDomUpdates(() => {
    expect(logger).toHaveErrors([message, el.nextSibling.nextSibling]);
  });
});
