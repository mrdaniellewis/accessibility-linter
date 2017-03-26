describe('main', () => {
  const message = 'document should have a <main>';

  beforeEach(() => {
    appendToBody('<header>foo</header>');
    appendToBody('<footer>foo</footer>');
  });

  it('does not add an error if the document has a main element', () => {
    appendToBody('<main>foo</main>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the document has an element with role main', () => {
    appendToBody('<div role="main">foo</div>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is no main', () => {
    linter.run();
    expect(logger).toHaveErrors([message, document.body]);
  });

  it('adds an error if main is hidden', () => {
    appendToBody('<main hidden>foo</main>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if main is empty', () => {
    appendToBody('<main />');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if main is in another document', () => {
    appendToBody('<div role="document"><main>foo</main</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if main is in another application', () => {
    appendToBody('<div role="application"><main>foo</main</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });
});

describe('header', () => {
  const message = 'document should have a <header>';

  beforeEach(() => {
    appendToBody('<main>foo</main>');
    appendToBody('<footer>foo</footer>');
  });

  it('does not add an error if the document has a header element', () => {
    appendToBody('<header>foo</header>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the document has an element with role banner', () => {
    appendToBody('<div role="banner">foo</div>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is no header', () => {
    linter.run();
    expect(logger).toHaveErrors([message, document.body]);
  });

  it('adds an error if header is hidden', () => {
    appendToBody('<header hidden>foo</header>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if header is empty', () => {
    appendToBody('<header />');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if header is in another document', () => {
    appendToBody('<div role="document"><header>foo</header</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if header is in another application', () => {
    appendToBody('<div role="application"><header>foo</header</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if header is in a section', () => {
    appendToBody('<section><header>foo</header</section>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });
});

describe('footer', () => {
  const message = 'document should have a <footer>';

  beforeEach(() => {
    appendToBody('<main>foo</main>');
    appendToBody('<header>foo</header>');
  });

  it('does not add an error if the document has a footer element', () => {
    appendToBody('<footer>foo</footer>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the document has an element with role contentinfo', () => {
    appendToBody('<div role="contentinfo">foo</div>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is no footer', () => {
    linter.run();
    expect(logger).toHaveErrors([message, document.body]);
  });

  it('adds an error if footer is hidden', () => {
    appendToBody('<footer hidden>foo</footer>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if footer is empty', () => {
    appendToBody('<footer />');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if footer is in another document', () => {
    appendToBody('<div role="document"><footer>foo</footer</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if footer is in another application', () => {
    appendToBody('<div role="application"><footer>foo</footer</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });

  it('adds an error if footer is in a section', () => {
    appendToBody('<section><footer>foo</footer</section>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, document.body]);
    });
  });
});

describe('no header, footer, or banner', () => {
  it('adds three errors', () => {
    linter.run();
    expect(logger).toHaveErrors(
      ['document should have a <main>', document.body],
      ['document should have a <header>', document.body],
      ['document should have a <footer>', document.body]
    );
  });

  it('does not add an error if the context does not include body', () => {
    const el = document.body.appendChild(document.createElement('div'));
    linter.run(el);
    expect(logger).toNotHaveEntries();
  });
});
