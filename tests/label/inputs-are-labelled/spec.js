it('generates the expected error message', () => {
  expect(test).toGenerateErrorMessage('all form elements must have a label');
});

['input', 'select', 'textarea'].forEach((name) => {
  describe(`for <${name}>`, () => {
    it('adds an error if there is no label', when(() => {
      el = appendToBody(`<${name} />`);
    }).then(() => {
      expect(logger).toHaveEntries([test, el]);
    }));

    it('does not add an error for an aria-labelledby label', when(() => {
      const id = uniqueId();
      appendToBody(`<${name} aria-labelledby="${id}"/><p id="${id}">label</p>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not add an error for an aria-label label', when(() => {
      appendToBody(`<${name} aria-label="label" />`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not add an error for an explicit label', when(() => {
      const id = uniqueId();
      appendToBody(`<${name} id="${id}"/><label for="${id}">label</label>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not add an error for an implicit label', when(() => {
      appendToBody(`<label>label<${name} /></label>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does not an error if aria-labelledby is missing and other labels are present', when(() => {
      el = appendToBody(`<${name} aria-label="label" aria-labelledby="${uniqueId()}"/>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does add an error if aria-labelledby is empty and other labels are present', when(() => {
      const id = uniqueId();
      el = appendToBody(`
        <${name} aria-label="label" aria-labelledby="${id}"/>
        <p id="${id}"></p>
      `);
    }).then(() => {
      expect(logger).toHaveEntries([test, el]);
    }));

    it('does add an error if aria-label is empty, and an associated label is present', when(() => {
      const id = uniqueId();
      el = appendToBody(`
        <${name} aria-label="" id="${id}"/>
        <label for="${id}">label</label>
      `);
    }).then(() => {
      expect(logger).toHaveEntries([test, el]);
    }));

    it('does add an error if the explicit label is empty, and an implicit label is present', when(() => {
      const id = uniqueId();
      appendToBody(`
        <label><${name} id="${id}"/>label</label>
        <label for="${id}"></label>
      `);
      el = $(name)[0];
    }).then(() => {
      expect(logger).toHaveEntries([test, el]);
    }));

    it('does not add an error if the explicit label is missing, and an implicit label is present', when(() => {
      const id = uniqueId();
      appendToBody(`<label><${name} id="${id}"/>label</label>`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));

    it('does add an error if the implicit label is empty', when(() => {
      appendToBody(`<label><${name} /></label>`);
      el = $(name)[0];
    }).then(() => {
      expect(logger).toHaveEntries([test, el]);
    }));

    it('does not blow up if an id needs escaping', when(() => {
      appendToBody(`
        <label for="$quot; \\">label</label>
        <label for="$quot; \\"></label>
      `);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));
  });
});

['submit', 'reset', 'image', 'button', 'hidden'].forEach((type) => {
  it(`does not add errors for <input type="${type}">`, when(() => {
    appendToBody(`<label><input type="${type}" /></label>`);
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});
