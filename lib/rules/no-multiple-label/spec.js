it('does not report for non-labelable elements', async () => {
  appendToBody('<label><label><div></label></label>');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for hidden inputs', async () => {
  appendToBody('<label><label><input type="hidden" /></label></label>');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  describe(`for <${name}>`, () => {
    it('does not report for no labels', async () => {
      appendToBody(`<${name}></${name}>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report for a single labels', async () => {
      appendToBody(`<label><${name}></${name}></label>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports for multiple labels', async () => {
      const id = uniqueId();
      const element = appendToBody(`<label><${name} id="${id}"></${name}></label><label for="${id}" />`).querySelector(name);
      await domChange;
      expect(reporter).toHaveErrors({ message: 'control should not have multiple labels', element });
    });

    it('reports for multiple nested labels', async () => {
      const element = appendToBody(`<label><label><${name}></${name}></label></label>`).querySelector(name);
      await domChange;
      expect(reporter).toHaveErrors({ message: 'control should not have multiple labels', element });
    });
  });
});
