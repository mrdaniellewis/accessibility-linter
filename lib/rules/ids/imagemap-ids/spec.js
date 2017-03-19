it('generates an error if a <map> has no name', () => {
  const el = appendToBody('<map></map>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['name attribute is required', el]);
  });
});

it('generates an error if a <map> name attribute contains spaces', () => {
  const el = appendToBody('<map name="xx xx"></map>');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['name attribute must not contain spaces', el]);
  });
});

context('map element with duplicate names - case-insensitive', () => {
  it('generates an error if a <map> has no name', () => {
    const id = uniqueId();
    const el = appendToBody(`<map name="${id}a"></map>`);
    const el2 = appendToBody(`<map name="${id}A"></map>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(
        ['name attribute must be case-insensitively unique', el],
        ['name attribute must be case-insensitively unique', el2]
      );
    });
  });
});

context('map elements not referenced by an image', () => {
  it('generates an error if a <map> has no name', () => {
    const id = uniqueId();
    const el = appendToBody(`<map name="${id}"></map>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['name attribute should be referenced by an img usemap attribute', el]);
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

context('with an id attribute', () => {
  it('does not generates an error if the id matches the name', () => {
    const id = uniqueId();
    appendToBody(`<map name="${id}" id="${id}"></map><img usemap="#${id}" />`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('generates an error if the id does not match the name', () => {
    const id = uniqueId();
    const el = appendToBody(`<map name="${id}" id="${id}x"></map><img usemap="#${id}" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['if the id attribute is present it must equal the name attribute', el]);
    });
  });
});
