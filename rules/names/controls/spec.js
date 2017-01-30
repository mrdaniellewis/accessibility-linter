it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('element must have a label');
});

['button', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  describe(name, () => {
    it('does not add an error if there is a label', when(() => {
      appendToBody(`<${name} aria-label="foo"></${name}>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('adds error if there is no label', when(() => {
      el = appendToBody(`<${name}></${name}>`);
    }).then(() => {
      expect(logger).toHaveEntries([rule, el]);
    }));

    it('does not add an error if it is hidden', when(() => {
      appendToBody(`<${name} aria-hidden="true"></${name}>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));
  });
});

describe('inputs', () => {
  it('does not add an error if there is a label', when(() => {
    appendToBody('<input aria-label="foo" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds error if there is no label', when(() => {
    el = appendToBody('<input />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));

  it('does not add an error if it is hidden', when(() => {
    appendToBody('<input aria-hidden="true" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add an error if it has a type of hidden', when(() => {
    appendToBody('<input type="hidden" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

