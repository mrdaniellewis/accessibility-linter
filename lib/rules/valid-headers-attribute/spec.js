['td', 'th'].forEach((name) => {
  describe(`for <${name}>`, () => {
    it('does not report if there is no headers attribute', async () => {
      appendToBody(`<table><tr><${name} /></tr></table>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report if the headers attribute points to a th', async () => {
      const id = uniqueId();
      appendToBody(`<table><tr><th id="${id}" /><${name} headers="${id}" /></tr></table>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report if the headers attribute points to multiple th', async () => {
      const id = uniqueId();
      const id2 = uniqueId();
      appendToBody(`<table><tr><th id="${id}" /><th id="${id2}" /><${name} headers="${id} ${id2}" /></tr></table>`);
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports if the headers attribute is empty', async () => {
      const element = appendToBody(`<table><tr><${name} headers="" /></tr></table>`).querySelector(name);
      await domChange;
      expect(reporter).toHaveErrors({ message: 'headers attribute should not be empty', element });
    });

    it('reports if header ids cannot be found', async () => {
      const id = uniqueId();
      const id2 = uniqueId();
      const element = appendToBody(`<table><tr><${name} headers="${id} ${id2}" /></tr></table>`).querySelector(name);
      await domChange;
      expect(reporter).toHaveErrors(
        { message: `cannot find a <th> with id "${id}"`, element },
        { message: `cannot find a <th> with id "${id2}"`, element },
      );
    });

    it('reports if a header is not a th', async () => {
      const id = uniqueId();
      const id2 = uniqueId();
      const element = appendToBody(`<table><tr id="${id2}"><${name} headers="${id} ${id2}" /><th id="${id}" /></tr></table>`).querySelector(name);
      await domChange;
      expect(reporter).toHaveErrors({ message: `header id "${id2}" does not point to a <th> element`, element });
    });
  });
});
