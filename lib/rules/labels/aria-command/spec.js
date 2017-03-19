const message = 'elements with a role with a superclass of command must have a label';

it('does not add an error to elements without a role', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

['button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio'].forEach((role) => {
  describe(`[role="${role}"]`, () => {
    it('does not add an error to elements that are hidden', () => {
      appendToBody(`<div role="${role}" aria-hidden="true" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not add an error to elements with a label', () => {
      appendToBody(`<div role="${role}">foo</div>`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does add an error to elements without a label', () => {
      const el = appendToBody(`<div role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('adds an error to elements with multiple roles', () => {
      const el = appendToBody(`<div role="${role} none" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });
  });
});
