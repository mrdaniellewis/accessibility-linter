it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('All checkbox groups must be within a fieldset');
});

context('within a form', () => {
  it('does not add an error if a checkbox has no name', when(() => {
    appendToBody('<form><input type="checkbox"></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox name is unique', when(() => {
    appendToBody('<form><input type="checkbox" name="x"></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox name is unique within a form', when(() => {
    appendToBody('<form><input type="checkbox" name="x"></form>');
    appendToBody('<form><input type="checkbox" name="x"></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox group is in a fieldset', when(() => {
    appendToBody('<form><fieldset><input type="checkbox" name="x"><input type="checkbox" name="x"></fieldset></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error if checkbox group is not in a fieldset', when(() => {
    appendToBody('<form><input type="checkbox" name="x"><input type="checkbox" name="x"></form>');
    el = $('input')[0];
    el2 = $('input')[1];
  }).then(() => {
    expect(logger).toHaveEntries([test, el], [test, el2]);
  }));
});

context('outside of a form', () => {
  it('does not add an error if a checkbox has no name', when(() => {
    appendToBody('<input type="checkbox">');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox name is unique', when(() => {
    appendToBody('<input type="checkbox" name="x">');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox name is unique outside of a form', when(() => {
    appendToBody('<input type="checkbox" name="x">');
    appendToBody('<form><input type="checkbox" name="x"></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if a checkbox group is in a fieldset', when(() => {
    appendToBody('<fieldset><input type="checkbox" name="x"><input type="checkbox" name="x"></fieldset>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error if checkbox group is not in a fieldset', when(() => {
    appendToBody('<input type="checkbox" name="x"><input type="checkbox" name="x">');
    el = $('input')[0];
    el2 = $('input')[1];
  }).then(() => {
    expect(logger).toHaveEntries([test, el], [test, el2]);
  }));

  it('does not blow up if the name required escaping', when(() => {
    appendToBody('<input type="checkbox" name="&quot; \\">');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});
