it('does not report a visible focusable element', async () => {
  appendToBody('<input />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

describe('element with aria-hidden="true"', () => {
  it('does not report non-visible element', async () => {
    appendToBody('<input hidden aria-hidden="true" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a visible element', async () => {
    const element = appendToBody('<input aria-hidden="true" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-hidden="true" is not allowed for a focusable element', element });
  });
});

describe('element with an aria-hidden="true" ancestor', () => {
  it('does not report non-visible element', async () => {
    appendToBody('<div aria-hidden="true"><input hidden /></div>').querySelector('input');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a visible element', async () => {
    const element = appendToBody('<div aria-hidden="true"><input /></div>').querySelector('input');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'focusable elements cannot have an ancestor with aria-hidden="true"', element });
  });
});

['none', 'presentation'].forEach((role) => {
  describe(`element with role ${role}`, () => {
    it('does not report non-visible element', async () => {
      appendToBody(`<input role="${role}" hidden />`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports a visible element', async () => {
      const element = appendToBody(`<input role="${role}" />`);
      await domChange;
      expect(reporter).toHaveErrors({ message: `focusable elements cannot have a role of ${role}`, element });
    });
  });
});
