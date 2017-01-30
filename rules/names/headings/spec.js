it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('headings must have a label');
});

['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((heading) => {
  describe(heading, () => {
    it('does not add an error if an element has a label', when(() => {
      appendToBody(`<${heading}>foo</${heading}>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not add an error if an element is hidden', when(() => {
      appendToBody(`<${heading} aria-hidden="true" />`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('adds an error if an element has no label', when(() => {
      el = appendToBody(`<${heading} />`);
    }).then(() => {
      expect(logger).toHaveEntries([rule, el]);
    }));
  });
});

describe('[role="heading"]', () => {
  it('does not add an error if an element does not have a role of heading', when(() => {
    appendToBody('<div>foo</div>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if an element has a label', when(() => {
    appendToBody('<div role="heading">foo</div>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if an element is hidden', when(() => {
    appendToBody('<div role="heading" aria-hidden="true" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error if an element has no label', when(() => {
    el = appendToBody('<div role="heading" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});
