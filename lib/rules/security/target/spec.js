const message = 'target attribute has opener vulnerability';
const linkMessage = `${message}. Add \`rel="noopener noreferrer"\``;

describe('<a>', () => {
  it('does not add an error if there is no target attribute', () => {
    appendToBody('<a href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is a target attribute', () => {
    const el = appendToBody('<a target="new" href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('adds an error if rel does not include noopener', () => {
    const el = appendToBody('<a target="new" href="http://invalid.com" rel="noreferrer" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('adds an error if rel does not include noreferrer', () => {
    const el = appendToBody('<a target="new" href="http://invalid.com" rel="noopener" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('does not add an error if rel includes noopener and noreferrer', () => {
    appendToBody('<a target="new" href="http://invalid.com" rel="noreferrer noopener" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the target is the same host', () => {
    appendToBody('<a target="new" href="/foo" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if hidden', () => {
    appendToBody('<a target="new" href="http://invalid.com" style="display: none" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if there is no href', () => {
    appendToBody('<a target="new" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if target is _self', () => {
    appendToBody('<a target="_self" href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

describe('<area>', () => {
  it('does not add an error if there is no target attribute', () => {
    appendToBody('<area href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is a target attribute', () => {
    const el = appendToBody('<area target="new" href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('adds an error if rel does not include noopener', () => {
    const el = appendToBody('<area target="new" href="http://invalid.com" rel="noreferrer" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('adds an error if rel does not include noreferrer', () => {
    const el = appendToBody('<area target="new" href="http://invalid.com" rel="noopener" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([linkMessage, el]);
    });
  });

  it('does not add an error if rel includes noopener and noreferrer', () => {
    appendToBody('<area target="new" href="http://invalid.com" rel="noreferrer noopener" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the target is the same host', () => {
    appendToBody('<area target="new" href="/foo" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if there is no href', () => {
    appendToBody('<area target="new" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if target is _self', () => {
    appendToBody('<area target="_self" href="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

describe('<base>', () => {
  it('does not add an error if there is no target attribute', () => {
    document.head.appendChild(buildHtml('<base href="http://invalid.com" />'));
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is a target attribute', () => {
    const el = document.head.appendChild(buildHtml('<base target="new" href="http://invalid.com" />'));
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not add an error if the is the same host', () => {
    document.head.appendChild(buildHtml('<base target="new" href="/foo" />'));
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if target is _self', () => {
    document.head.appendChild(buildHtml('<base target="_self" href="http://invalid.com" />'));
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

describe('<form>', () => {
  it('does not add an error if there is no target attribute', () => {
    appendToBody('<form action="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is a target attribute', () => {
    const el = appendToBody('<form target="new" action="http://invalid.com" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not add an error if the is the same host', () => {
    appendToBody('<form action="/foo" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if target is _self', () => {
    appendToBody('<form action="http://invalid.com" target="_self" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the element is hidden', () => {
    appendToBody('<form target="new" action="http://invalid.com" hidden />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

describe('submit button with formtarget', () => {
  it('does not add an error if there is no target attribute', () => {
    appendToBody('<form action="http://invalid.com"><input type="submit" /></form>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error if there is a target attribute', () => {
    const el = appendToBody('<form action="http://invalid.com"><input type="submit" formtarget="new" /></form>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el.querySelector('input')]);
    });
  });

  it('does not add an error if the is the same host', () => {
    appendToBody('<form action="http://invalid.com"><input type="submit" formtarget="new" formaction="/foo" /></form>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if target is _self', () => {
    appendToBody('<form action="http://invalid.com"><input type="submit" formtarget="_self" /></form>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if the element is hidden', () => {
    appendToBody('<form action="http://invalid.com"><input type="submit" formtarget="new" hidden /></form>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('bad url', () => {
  it('does not error for a bad url', () => {
    appendToBody('<a href="xxx xxx" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});
