const message = 'do not mark focusable elements with a role of presentation or none';

['none', 'presentation'].forEach((role) => {
  describe(`role=${role}`, () => {
    it('does not generate an error for not focusable', () => {
      appendToBody(`<div role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not generate an error for a hidden input', () => {
      appendToBody(`<input type="hidden" role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not generate an error for a placeholder link', () => {
      appendToBody(`<a role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    it('does not generate an error for a placeholder area', () => {
      appendToBody(`<area role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });

    ['input', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
      it(`does generate an error for <${name}>`, () => {
        const el = appendToBody(`<${name} role="${role}"></${name}>`);
        return whenDomUpdates(() => {
          expect(logger).toHaveErrors([message, el]);
        });
      });
    });

    it('does generate an error for an element with a tabindex', () => {
      const el = appendToBody(`<div tabindex="-1" role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does generate an error for an anchor with a href', () => {
      const el = appendToBody(`<a href="#" role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });

    it('does generate an error for an area with a href', () => {
      const el = appendToBody(`<area href="#" role="${role}" />`);
      return whenDomUpdates(() => {
        expect(logger).toHaveErrors([message, el]);
      });
    });
  });
});

describe('role="none presentation"', () => {
  it('does generate where multiple roles are specified', () => {
    const el = appendToBody('<div tabindex="-1" role="none presentation" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });
});
