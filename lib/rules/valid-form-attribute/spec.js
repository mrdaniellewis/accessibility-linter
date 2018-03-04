['button', 'fieldset', 'input', 'object', 'output', 'select', 'textarea'].forEach((name) => {
  describe(`for a <${name}>`, () => {
    it('does not report if there is no form attribute', async () => {
      appendToBody(`<${name} />`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report if there is a valid form', async () => {
      const id = uniqueId();
      appendToBody(`<form id="${id}"></form><${name} form="${id}"></${name}>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    [...' \t\n\f\r'].forEach((char) => {
      it(`reports if the form attribute contains space characters ${char.charCodeAt(0)}`, async () => {
        const element = appendToBody(`<${name} form="foo${char}bar"></${name}>`);
        await domChange;
        expect(reporter).toHaveErrors({ message: 'form attribute should not contain space characters', element });
      });
    });

    it('reports if there is no form', async () => {
      const id = uniqueId();
      const element = appendToBody(`<${name} form="${id}"></${name}>`);
      await domChange;
      expect(reporter).toHaveErrors({ message: `cannot find form with id "${id}"`, element });
    });

    it('reports if the target is not a form', async () => {
      const id = uniqueId();
      const element = appendToBody(`<${name} form="${id}"></${name}><div id="${id}" />`);
      await domChange;
      expect(reporter).toHaveErrors({ message: 'form attribute does not point to a <form> element', element });
    });
  });
});
