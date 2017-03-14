const message = 'form controls must have a label';

['button', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  describe(name, () => {
    it('does not add an error if there is a label', () => {
      appendToBody(`<${name} aria-label="foo"></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('adds error if there is no label', () => {
      const el = appendToBody(`<${name}></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does not add an error if it is hidden', () => {
      appendToBody(`<${name} aria-hidden="true"></${name}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});

describe('inputs', () => {
  it('does not add an error if there is a label', () => {
    appendToBody('<input aria-label="foo" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds error if there is no label', () => {
    const el = appendToBody('<input />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not add an error if it is hidden', () => {
    appendToBody('<input aria-hidden="true" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if it has a type of hidden', () => {
    appendToBody('<input type="hidden" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});
