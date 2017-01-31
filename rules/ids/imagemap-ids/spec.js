context('map element with no name', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<map></map>');
    expect(rule).toGenerateErrorMessage({ for: el }, 'map elements should have a name');
  });

  it('generates an error if a <map> has no name', when(() => {
    el = appendToBody('<map></map>');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('map element with an empty name', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<map name=""></map>');
    expect(rule).toGenerateErrorMessage({ for: el }, 'map elements should have a name');
  });

  it('generates an error if a <map> has no name', when(() => {
    el = appendToBody('<map name=""></map>');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('map element with duplicate names - case-insensitive', () => {
  it('generates the expected error message', () => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}a"></map><map name="${id}A"></map>`);
    expect(rule).toGenerateErrorMessage({ for: el }, 'map element names must be case-insensitively unique');
  });

  it('generates an error if a <map> has no name', when(() => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}a"></map>`);
    el2 = appendToBody(`<map name="${id}A"></map>`);
  }).then(() => {
    expect(logger).toHaveEntries([rule, el], [rule, el2]);
  }));
});

context('map elements not referenced by an image', () => {
  it('generates the expected error message', () => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}"></map>`);
    expect(rule).toGenerateErrorMessage({ for: el }, 'map elements should be referenced by an img usemap attribute');
  });

  it('generates an error if a <map> has no name', when(() => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}"></map>`);
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('map elements referenced by an image', () => {
  it('should not generates an error', when(() => {
    const id = uniqueId();
    appendToBody(`<map name="${id}a"></map><img usemap="#${id}A" />`);
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('hidden map elements', () => {
  it('should generates an error if invalid', when(() => {
    el = appendToBody('<map></map>');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});
