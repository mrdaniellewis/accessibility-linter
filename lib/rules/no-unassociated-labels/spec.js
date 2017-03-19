context('labelling by id', () => {
  it('does not add an error if labelling an element', () => {
    const id = uniqueId();
    appendToBody(`<label for="${id}">foo</label><input id="${id}" />`);

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if the label is not labelling anything', () => {
    const id = uniqueId();
    const el = appendToBody(`<label for="${id}">foo</label>`);

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['label is not labelling an element', el]);
    });
  });

  it('adds an error if the label target element is hidden', () => {
    const id = uniqueId();
    const el = appendToBody(`<label for="${id}">foo</label><input style="display: none;" id="${id}" />`);

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['label is labelling a hidden element', el]);
    });
  });

  it('does not add an error if the label is hidden', () => {
    const id = uniqueId();
    appendToBody(`<label for="${id}" style="display: none;">foo</label><input id="${id}" />`);

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('labelling by DOM hierarchy', () => {
  it('does not add an error if labelling an element', () => {
    appendToBody('<label>foo<input /></label>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if the label is not labelling anything', () => {
    const el = appendToBody('<label>foo</label>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['label is not labelling an element', el]);
    });
  });

  it('adds an error if the label target element is hidden', () => {
    const el = appendToBody('<label>foo<input style="display: none;" /></label>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['label is labelling a hidden element', el]);
    });
  });

  it('does not add an error if the label is hidden', () => {
    appendToBody('<label style="display: none">foo<input /></label>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});
