[['fieldset', 'legend'], ['details', 'summary']].forEach(([parent, child]) => {
  const message = `${parent} must have a label`;

  describe(parent, () => {
    it('does not add an error if there is a label', () => {
      appendToBody(`<${parent} aria-label="foo"></${parent}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it(`does not add an error if there is a ${child}`, () => {
      appendToBody(`<${parent}><${child}>foo</${parent}></${child}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it(`does not add an error if there is a ${child} with a label`, () => {
      appendToBody(`<${parent}><${child} aria-label="foo" /></${child}>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it(`adds error if there is no ${child}`, () => {
      const el = appendToBody(`<${parent} />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it(`adds error if the ${child} is hidden`, () => {
      const el = appendToBody(`<${parent}><${child} aria-hidden="true">foo</${child}></${child}>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does not add an error if it is hidden', () => {
      appendToBody(`<${parent} style="display: none;" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});

['group', 'radiogroup'].forEach((name) => {
  const message = `${name} must have a label`;

  describe(`role=${name}`, () => {
    it('does not add an error if there is a label', () => {
      appendToBody(`<div role="${name}" aria-label="foo"></div>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('adds error if there is no label', () => {
      const el = appendToBody(`<div role="${name}"></div>`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does not add an error if it is hidden', () => {
      appendToBody(`<div role="${name}" style="display: none;"></div>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});
