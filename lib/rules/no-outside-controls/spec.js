const message = 'all controls should be associated with a form';

['input', 'textarea', 'select'].forEach((type) => {
  describe(type, () => {
    it('adds an error outside of a form', when(() => {
      el = appendToBody(`<${type} />`);
    }).then(() => {
      expect(logger).toHaveEntries([message, el]);
    }));

    it('does not adds an error inside a form', when(() => {
      appendToBody(`<form><${type} /></form>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));
  });
});

describe('<button> without a type', () => {
  it('adds an error outside of a form', when(() => {
    el = appendToBody('<button></button>');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('does not adds an error inside a form', when(() => {
    appendToBody('<form><button></button></form>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

['submit', 'reset'].forEach((type) => {
  describe(`<button type="${type}">`, () => {
    it('adds an error outside of a form', when(() => {
      el = appendToBody(`<button type="${type}" />`);
    }).then(() => {
      expect(logger).toHaveEntries([message, el]);
    }));

    it('does not adds an error inside a form', when(() => {
      appendToBody(`<form><button type="${type}"></button></form>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));
  });
});

describe('<button type="button">', () => {
  it('does not adds an error outside a form', when(() => {
    appendToBody('<button type="button"></button>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

