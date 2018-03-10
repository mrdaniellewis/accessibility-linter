const originalTitle = document.title;
beforeEach(() => {
  document.title = originalTitle;
});

describe('document title', () => {
  it('does not report if the document has a title', () => {
    document.title = 'title';
    linter.run();
    expect(reporter).not.toHaveErrors();
  });

  it('reports if the document does not have a title', () => {
    document.title = '';
    linter.run();
    expect(reporter).toHaveErrors({ message: 'document must have a title', element: document });
  });

  it('reports if the document title is whitespace', () => {
    document.title = '  \n\t';
    linter.run();
    expect(reporter).toHaveErrors({ message: 'document must have a title', element: document });
  });

  describe('emptyTitle option', () => {
    beforeEach(() => {
      linter.rules = [new Rule({ type: 'error', emptyTitle: 'foo - ' })];
    });

    it('does not reports if the document has a title', () => {
      document.title = 'foo - bar';
      linter.run();
      expect(reporter).not.toHaveErrors();
    });

    it('reports if the document does not have a title', () => {
      document.title = '';
      linter.run();
      expect(reporter).toHaveErrors({ message: 'document must have a title', element: document });
    });

    it('reports if the document has the emptyTitle', () => {
      document.title = 'foo -';
      linter.run();
      expect(reporter).toHaveErrors({ message: 'document must have a title', element: document });
    });
  });
});

describe('title elements', () => {
  it('does not report for one title element', () => {
    linter.run();
    expect(reporter).not.toHaveErrors();
  });

  it('reports for multiple title elements', async () => {
    const title = document.createElement('title');
    document.head.appendChild(title);
    await domChange;
    expect(reporter).toHaveErrors({ message: 'document must only have one <title> element', element: title });
  });

  it('reports for title elements not in the <head>', async () => {
    const title = appendToBody('<title>foo</title>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'must only appear in <head>', element: title });
  });
});
