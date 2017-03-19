const message = 'headings must have a label';

['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((heading) => {
  describe(heading, () => {
    it('does not add an error if an element has a label', () => {
      appendToBody(`<${heading}>foo</${heading}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not add an error if an element is hidden', () => {
      appendToBody(`<${heading} aria-hidden="true" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('adds an error if an element has no label', () => {
      const el = appendToBody(`<${heading} />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });
  });
});

describe('[role="heading"]', () => {
  it('does not add an error if an element does not have a role of heading', () => {
    appendToBody('<div>foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if an element has a label', () => {
    appendToBody('<div role="heading">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if an element is hidden', () => {
    appendToBody('<div role="heading" aria-hidden="true" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if an element has no label', () => {
    const el = appendToBody('<div role="heading" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error if an element has multiple roles', () => {
    const el = appendToBody('<div role="heading none" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });
});
