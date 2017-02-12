context('map element with no name', () => {
  it('generates an error if a <map> has no name', when(() => {
    el = appendToBody('<map></map>');
  }).then(() => {
    expect(logger).toHaveEntries(['map elements should have a name', el]);
  }));
});

context('map element with an empty name', () => {
  it('generates an error if a <map> has no name', when(() => {
    el = appendToBody('<map name=""></map>');
  }).then(() => {
    expect(logger).toHaveEntries(['map elements should have a name', el]);
  }));
});

context('map element with duplicate names - case-insensitive', () => {
  it('generates an error if a <map> has no name', when(() => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}a"></map>`);
    el2 = appendToBody(`<map name="${id}A"></map>`);
  }).then(() => {
    expect(logger).toHaveEntries(['map element names must be case-insensitively unique', el], ['map element names must be case-insensitively unique', el2]);
  }));
});

context('map elements not referenced by an image', () => {
  it('generates an error if a <map> has no name', when(() => {
    const id = uniqueId();
    el = appendToBody(`<map name="${id}"></map>`);
  }).then(() => {
    expect(logger).toHaveEntries(['map elements should be referenced by an img usemap attribute', el]);
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
    expect(logger).toHaveEntries(['map elements should have a name', el]);
  }));
});
