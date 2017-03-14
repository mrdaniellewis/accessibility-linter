context('map element with no name', () => {
  it('generates an error if a <map> has no name', () => {
    const el = appendToBody('<map></map>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['map elements should have a name', el]);
    });
  });
});

context('map element with an empty name', () => {
  it('generates an error if a <map> has no name', () => {
    const el = appendToBody('<map name=""></map>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['map elements should have a name', el]);
    });
  });
});

context('map element with duplicate names - case-insensitive', () => {
  it('generates an error if a <map> has no name', () => {
    const id = uniqueId();
    const el = appendToBody(`<map name="${id}a"></map>`);
    const el2 = appendToBody(`<map name="${id}A"></map>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['map element names must be case-insensitively unique', el], ['map element names must be case-insensitively unique', el2]);
    });
  });
});

context('map elements not referenced by an image', () => {
  it('generates an error if a <map> has no name', () => {
    const id = uniqueId();
    const el = appendToBody(`<map name="${id}"></map>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['map elements should be referenced by an img usemap attribute', el]);
    });
  });
});

context('map elements referenced by an image', () => {
  it('should not generates an error', () => {
    const id = uniqueId();
    appendToBody(`<map name="${id}a"></map><img usemap="#${id}A" />`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('hidden map elements', () => {
  it('should generates an error if invalid', () => {
    const el = appendToBody('<map></map>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['map elements should have a name', el]);
    });
  });
});
