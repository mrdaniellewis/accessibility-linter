const message = 'all controls should be associated with a form';

['input', 'textarea', 'select'].forEach((type) => {
  describe(type, () => {
    it('adds an error outside of a form', () => {
      const el = appendToBody(`<${type} />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does not adds an error inside a form', () => {
      appendToBody(`<form><${type} /></form>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not adds an error for a hidden input', () => {
      appendToBody(`<${type} style="display: none;" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not adds an error for a disabled input', () => {
      appendToBody(`<${type} disabled />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});

describe('<button> without a type', () => {
  it('adds an error outside of a form', () => {
    const el = appendToBody('<button></button>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not adds an error inside a form', () => {
    appendToBody('<form><button></button></form>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not adds an error for a hidden button', () => {
    appendToBody('<button style="display: none"></button>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not adds an error for a disabled button', () => {
    appendToBody('<button disabled></button>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

['submit', 'reset'].forEach((type) => {
  describe(`<button type="${type}">`, () => {
    it('adds an error outside of a form', () => {
      const el = appendToBody(`<button type="${type}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does not adds an error inside a form', () => {
      appendToBody(`<form><button type="${type}"></button></form>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not adds an error for a hidden button', () => {
      appendToBody(`<button type="${type}" style="display: none"></button>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not adds an error for a disabled button', () => {
      appendToBody(`<button type="${type}" disabled></button>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});

describe('<button type="button">', () => {
  it('does not adds an error outside a form', () => {
    appendToBody('<button type="button"></button>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});
