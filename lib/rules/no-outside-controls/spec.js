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
