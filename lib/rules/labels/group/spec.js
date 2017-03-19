const message = 'fieldsets, groups and radiogroups must have a label';

describe('fieldset', () => {
  it('does not add an error if there is a label', () => {
    appendToBody('<fieldset aria-label="foo"></fieldset>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if there is a legend', () => {
    appendToBody('<fieldset><legend>foo</legend></fieldset>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error if there is a legend with a label', () => {
    appendToBody('<fieldset><legend aria-label="foo" /></fieldset>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds error if there is no label', () => {
    const el = appendToBody('<fieldset />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds error if the legend is hidden', () => {
    const el = appendToBody('<fieldset><legend aria-hidden="true">foo</legend></fieldset>');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not add an error if it is hidden', () => {
    appendToBody('<fieldset style="display: none;" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

['group', 'radiogroup'].forEach((name) => {
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
