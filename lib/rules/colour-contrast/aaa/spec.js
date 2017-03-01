it('is disabled by default', () => {
  const rule = new Rule();
  expect(rule.enabled).toEqual(false);
});

context('standard sized text', () => {
  it('does not add an error for a contrast of 7', when(() => {
    appendToBody('<div style="color: #595959; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('it adds an error for a contrast less than 7', when(() => {
    el = appendToBody('<div style="color: #5a5a5a; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toHaveEntries(['contrast is too low 6.9:1', el]);
  }));
});

context('text larger than 18pt', () => {
  it('does not add an error for contrast of 4.5', when(() => {
    appendToBody('<div style="font-size: 18pt; color: #767676; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for a contrast of less than 4.5', when(() => {
    el = appendToBody('<div style="font-size: 18pt; color: #777; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toHaveEntries(['contrast is too low 4.48:1', el]);
  }));
});

context('text larger than 14pt and bold', () => {
  it('does not add an error for contrast of 4.5', when(() => {
    appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #767676; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for a contrast of less than 4.5', when(() => {
    el = appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #777; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toHaveEntries(['contrast is too low 4.48:1', el]);
  }));
});

context('text larger than 14pt and not bold', () => {
  it('does not add an error for contrast of 4.5', when(() => {
    el = appendToBody('<div style="font-size: 14pt; color: #767676; background-color: #fff;">foo</div>');
  }).then(() => {
    expect(logger).toHaveEntries(['contrast is too low 4.54:1', el]);
  }));
});
