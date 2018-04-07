it('does not report an element with no aria attribute', async () => {
  appendToBody('<div arianotactually />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report an element with a valid aria-attribute', async () => {
  appendToBody('<div aria-live="polite" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports unknown aria attributes', async () => {
  const element = appendToBody('<div aria-foo="bar" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'aria-foo is not a known aria attribute', element });
});

describe('allowed attributes', () => {
  it('reports attributes not allowed on an element', async () => {
    const element = appendToBody('<div aria-checked="true" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-checked is not allowed on this element', element });
  });

  it('reports implicit attributes on an element', async () => {
    const element = appendToBody('<input type="checkbox" aria-checked="true" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-checked is implicit on this element and should not be specified', element });
  });
});

describe('true/false attributes', () => {
  it('does not report true', async () => {
    appendToBody('<div aria-atomic="true" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report false', async () => {
    appendToBody('<div aria-atomic="false" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div aria-atomic />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-atomic must be one of: false, true', element });
  });

  it('reports other values', async () => {
    const element = appendToBody('<div aria-atomic="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-atomic must be one of: false, true', element });
  });
});

describe('reports invalid true/false/undefined attributes', () => {
  it('does not report true', async () => {
    appendToBody('<button aria-expanded="true" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report false', async () => {
    appendToBody('<button aria-expanded="false" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report undefined', async () => {
    appendToBody('<button aria-expanded="undefined" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<button aria-expanded />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-expanded must be one of: false, true, undefined', element });
  });

  it('reports other values', async () => {
    const element = appendToBody('<button aria-expanded="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-expanded must be one of: false, true, undefined', element });
  });
});

describe('reports invalid tristate attributes', () => {
  it('does not report true', async () => {
    appendToBody('<button aria-pressed="true" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report false', async () => {
    appendToBody('<button aria-pressed="false" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report undefined', async () => {
    appendToBody('<button aria-pressed="undefined" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report mixed', async () => {
    appendToBody('<button aria-pressed="mixed" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<button aria-pressed />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-pressed must be one of: false, mixed, true, undefined', element });
  });

  it('reports other values', async () => {
    const element = appendToBody('<button aria-pressed="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-pressed must be one of: false, mixed, true, undefined', element });
  });
});

describe('reports invalid token attributes', () => {
  it('does not report a valid value', async () => {
    appendToBody('<button aria-haspopup="menu" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<button aria-haspopup />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-haspopup must be one of: false, true, menu, listbox, tree, grid, dialog', element });
  });

  it('reports other values', async () => {
    const element = appendToBody('<button aria-haspopup="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-haspopup must be one of: false, true, menu, listbox, tree, grid, dialog', element });
  });
});

describe('reports invalid tokenlist attributes', () => {
  it('does not report a valid value', async () => {
    appendToBody('<div aria-relevant="all" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report a valid values', async () => {
    appendToBody('<div aria-relevant="additions text" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div aria-relevant />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-relevant must be one or more of: additions, all, removals, text', element });
  });

  it('reports other values', async () => {
    const element = appendToBody('<div aria-relevant="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-relevant must be one or more of: additions, all, removals, text', element });
  });

  it('reports values that must be used alone', async () => {
    const element = appendToBody('<div aria-relevant="all text" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-relevant should only contain the following values on their own: all', element });
  });
});

describe('reports invalid id attributes', () => {
  it('does not report a valid id', async () => {
    const id = uniqueId();
    appendToBody(`<div aria-details="${id}" /><div id="${id}" />`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div aria-details />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-details must be an element id', element });
  });

  it('reports spaces', async () => {
    const element = appendToBody('<div aria-details="foo bar" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-details must not contain spaces', element });
  });

  it('reports an id that cannot be found', async () => {
    const id = uniqueId();
    const element = appendToBody(`<div aria-details="${id}" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: `aria-details no element can be found with an id of "${id}"`, element });
  });
});

describe('reports invalid idlist attributes', () => {
  it('does not report a valid id', async () => {
    const id = uniqueId();
    appendToBody(`<div aria-describedby="${id}" /><div id="${id}" />`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report multiple valid ids', async () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    appendToBody(`<div aria-describedby="${id1} ${id2}" /><div id="${id1}" /><div id="${id2}" />`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div aria-describedby />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-describedby must be one or more ids', element });
  });

  it('reports an id that cannot be found', async () => {
    const id = uniqueId();
    const element = appendToBody(`<div aria-describedby="${id}" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: `aria-describedby no element can be found with an id of "${id}"`, element });
  });

  it('reports multiple ids that cannot be found', async () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    const id3 = uniqueId();
    const element = appendToBody(`<div aria-describedby="${id1} ${id2} ${id3}" /><div id="${id1}" />`);
    await domChange;
    expect(reporter).toHaveErrors(
      { message: `aria-describedby no element can be found with an id of "${id2}"`, element },
      { message: `aria-describedby no element can be found with an id of "${id3}"`, element },
    );
  });

  it('reports duplicate ids', async () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    const element = appendToBody(`<div aria-describedby="${id1} ${id2} ${id2}" /><div id="${id1}" />`);
    await domChange;
    expect(reporter).toHaveErrors(
      { message: `aria-describedby no element can be found with an id of "${id2}"`, element },
      { message: `aria-describedby duplicate id "${id2}"`, element },
    );
  });
});

describe('reports invalid string attributes', () => {
  it('does not report a valid string', async () => {
    appendToBody('<div aria-label="foo" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing string', async () => {
    const element = appendToBody('<div aria-label />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-label must be a non-empty string', element });
  });
});

describe('reports invalid integer attributes', () => {
  it('does not report a valid integer', async () => {
    appendToBody('<div role="heading" aria-label="1" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div role="heading" aria-level />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-level must be an integer', element });
  });

  it('reports a decimal number', async () => {
    const element = appendToBody('<div role="heading" aria-level="1.1" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-level must be an integer', element });
  });

  it('reports not a number', async () => {
    const element = appendToBody('<div role="heading" aria-level="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-level must be an integer', element });
  });
});

describe('reports invalid number attributes', () => {
  it('does not report a valid integer number', async () => {
    appendToBody('<div role="scrollbar" aria-valuenow="10" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report a valid decimal number', async () => {
    appendToBody('<div role="scrollbar" aria-valuenow="10.2" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report a valid negative decimal number', async () => {
    appendToBody('<div role="scrollbar" aria-valuenow="-10.2" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report a valid exponential decimal number', async () => {
    appendToBody('<div role="scrollbar" aria-valuenow="10.2e-3" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports a missing value', async () => {
    const element = appendToBody('<div role="scrollbar" aria-valuenow />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-valuenow must be a floating point number', element });
  });

  it('reports not a number', async () => {
    const element = appendToBody('<div role="scrollbar" aria-valuenow="foo" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-valuenow must be a floating point number', element });
  });
});

describe('aria-invalid', () => {
  describe('on an element without native constraint validation', () => {
    it('does not report aria-invalid="false"', async () => {
      appendToBody('<div aria-invalid="false" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report aria-invalid="true"', async () => {
      appendToBody('<div aria-invalid="true" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report aria-invalid="spelling"', async () => {
      appendToBody('<div aria-invalid="spelling" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });
  });

  describe('on an element with native constraint validation', () => {
    describe('when willValidate=false', () => {
      it('does not report aria-invalid="false"', async () => {
        appendToBody('<button aria-invalid="false" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('does not report aria-invalid="true"', async () => {
        appendToBody('<button aria-invalid="true" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('does not report aria-invalid="spelling"', async () => {
        appendToBody('<button aria-invalid="spelling" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });
    });

    describe('when native constraints are met', () => {
      it('does not report aria-invalid="false"', async () => {
        appendToBody('<input aria-invalid="false" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('does not report aria-invalid="true"', async () => {
        appendToBody('<input aria-invalid="true" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('does not report aria-invalid="spelling"', async () => {
        appendToBody('<input aria-invalid="spelling" />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });
    });

    describe('when native constraints are not met', () => {
      it('does not report aria-invalid="true"', async () => {
        appendToBody('<input aria-invalid="true" required />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('does not report aria-invalid="spelling"', async () => {
        appendToBody('<input aria-invalid="spelling" required />');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('reports aria-invalid="false"', async () => {
        const element = appendToBody('<input aria-invalid="false" required />');
        await domChange;
        expect(reporter).toHaveErrors({ message: 'aria-invalid must not be false if checkValidity() returns false', element });
      });
    });
  });
});

describe('aria-readonly', () => {
  describe('if contenteditable is not set', () => {
    it('does not report aria-readonly="true"', async () => {
      appendToBody('<div role="textbox" aria-readonly="true" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report aria-readonly="false"', async () => {
      appendToBody('<div role="textbox" aria-readonly="false" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });
  });

  describe('if contenteditable is set to false', () => {
    it('does not report aria-readonly="true"', async () => {
      appendToBody('<div role="textbox" aria-readonly="true" contenteditable="false" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report aria-readonly="false"', async () => {
      appendToBody('<div role="textbox" aria-readonly="false" contenteditable="false" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });
  });

  describe('if contenteditable is set to true', () => {
    it('does not report aria-readonly="false"', async () => {
      appendToBody('<div role="textbox" aria-readonly="false" contenteditable="true" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports aria-readonly="true"', async () => {
      const element = appendToBody('<div role="textbox" aria-readonly="true" contenteditable="true" />');
      await domChange;
      expect(reporter).toHaveErrors({ message: 'aria-readonly must not be true for an element with contenteditable="true"', element });
    });
  });
});

describe('deprecated attributes', () => {
  it('reports deprecated attributes', async () => {
    const element = appendToBody('<div aria-dropeffect="copy" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'aria-dropeffect is deprecated and should not be used', element });
  });
});

describe('aria-hidden', () => {
  describe('without hidden', () => {
    it('does not report aria-hidden="true"', async () => {
      appendToBody('<div aria-hidden="true" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('does not report aria-hidden="false"', async () => {
      appendToBody('<div aria-hidden="false" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });
  });

  describe('with hidden', () => {
    it('does not report aria-hidden="false"', async () => {
      appendToBody('<div aria-hidden="false" hidden />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports aria-hidden="true"', async () => {
      const element = appendToBody('<div aria-hidden="true" hidden />');
      await domChange;
      expect(reporter).toHaveErrors({ message: 'aria-hidden does not need to be used if "hidden" is used', element });
    });
  });
});

describe('reports invalid mix of none/presentation and global attributes', () => {
  ['none', 'presentation'].forEach((role) => {
    describe(`explicit ${role}`, () => {
      it('does not report with aria-hidden="true"', async () => {
        appendToBody(`<div role="${role}" aria-hidden="true" />`);
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('reports with a global attribute set', async () => {
        const element = appendToBody(`<div role="${role}" aria-invalid="true" />`);
        await domChange;
        expect(reporter).toHaveErrors({ message: `aria-invalid must not be used if the role is ${role}`, element });
      });

      it('reports with aria-hidden="false" set', async () => {
        const element = appendToBody(`<div role="${role}" aria-hidden="false" />`);
        await domChange;
        expect(reporter).toHaveErrors({ message: `aria-hidden must not be used if the role is ${role}`, element });
      });
    });

    describe(`inherited ${role}`, () => {
      it('does not report with aria-hidden="true"', async () => {
        appendToBody(`<ul role="${role}"><li aria-hidden="true" /></ul>`).querySelector('li');
        await domChange;
        expect(reporter).not.toHaveErrors();
      });

      it('reports with a global attribute set', async () => {
        const element = appendToBody(`<ul role="${role}"><li aria-invalid="true" /></ul>`).querySelector('li');
        await domChange;
        expect(reporter).toHaveErrors({ message: `aria-invalid must not be used for an inherited role of ${role}`, element });
      });

      it('reports with aria-hidden="false" set', async () => {
        const element = appendToBody(`<ul role="${role}"><li aria-hidden="false" /></ul>`).querySelector('li');
        await domChange;
        expect(reporter).toHaveErrors({ message: `aria-hidden must not be used for an inherited role of ${role}`, element });
      });
    });
  });
});

describe('multiple errors', () => {
  it('reports multiple errors', async () => {
    const element = appendToBody('<div aria-foo aria-grabbed="bar" />');
    await domChange;
    expect(reporter).toHaveErrors(
      { message: 'aria-foo is not a known aria attribute', element },
      { message: 'aria-grabbed must be one of: false, true, undefined', element },
      { message: 'aria-grabbed is deprecated and should not be used', element },
    );
  });
});
