describe('<a>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<a href="#">foo</a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<a href="#" aria-label="foo"></a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<a href="#" hidden></a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<a href="#"></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when the role is set to none', async () => {
    const element = appendToBody('<a href="#" role="none"></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when aria-hidden', async () => {
    const element = appendToBody('<a href="#" aria-hidden="true"></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<button>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<button>foo</button>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<button aria-label="foo"></button>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<button hidden></button>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<button></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when aria-hidden', async () => {
    const element = appendToBody('<button aria-hidden="true"></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<details>', () => {
  it('it does not report if it has a legend', async () => {
    appendToBody('<details><summary>foo</summary></details>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('it does not report if it has an aria name', async () => {
    appendToBody('<details aria-label="foo"></details>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<details />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<fieldset>', () => {
  it('it does not report if it has a legend', async () => {
    appendToBody('<fieldset><legend>foo</legend></fieldset>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('it does not report if it has an aria name', async () => {
    appendToBody('<fieldset aria-label="foo"></fieldset>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<fieldset />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<div role="heading">', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<div role="heading">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<div role="heading" aria-label="foo"></div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<div role="heading" hidden></div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<div role="heading"></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<h1>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<h1>foo</h1>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<h1 aria-label="foo"></h1>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<h1 hidden></h1>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<h1></h1>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<iframe>', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<iframe title="foo" src="about:blank" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<iframe src="about:blank" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<img>', () => {
  it('does not reports if it does not have a name', async () => {
    // Without a name it no longer maps to image!
    appendToBody('<img />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });
});

describe('<input>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<label>foo<input /></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<input aria-label="foo" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<input hidden />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<input />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when aria-hidden', async () => {
    const element = appendToBody('<input aria-hidden="true"></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  describe('<input type="hidden">', () => {
    it('does not report when it does not have a name', async () => {
      appendToBody('<input type="hidden" />');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });
  });

  ['text', 'search', 'tel', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'number', 'range', 'color', 'checkbox', 'radio', 'file', 'button'].forEach((type) => {
    describe(`<input type="${type}">`, () => {
      it('reports when it does not have a name', async () => {
        const element = appendToBody(`<input type="${type}" />`);
        await domChange;
        expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
      });
    });
  });

  ['submit', 'reset', 'image'].forEach((type) => {
    describe(`<input type="${type}">`, () => {
      it('it does not report when it does not have a name', async () => {
        // These elements have a default name
        appendToBody(`<input type="${type}" />`);
        await domChange;
        expect(reporter).not.toHaveErrors();
      });
    });
  });
});

describe('<select>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<label>foo<select></select></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<select aria-label="foo"></select>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<select hidden></select>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<select></select>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when aria-hidden', async () => {
    const element = appendToBody('<select aria-hidden="true"></select>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<textarea>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<label>foo<textarea></textarea></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<textarea aria-label="foo"></textarea>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<textarea hidden></textarea>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<textarea></textarea>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });

  it('reports if it does not have a name when aria-hidden', async () => {
    const element = appendToBody('<textarea aria-hidden="true"></textarea>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<table>', () => {
  it('does not report when it has a name', async () => {
    appendToBody('<table><caption>foo</caption><tr><th>col</th><th>col</th></tr><tr><td>cell</td><td>cell</td></tr></table>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it has an aria name', async () => {
    appendToBody('<table aria-label="foo"><tr><th>col</th><th>col</th></tr><tr><td>cell</td><td>cell</td></tr></table>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is not visible', async () => {
    appendToBody('<table hidden><tr><th>col</th><th>col</th></tr><tr><td>cell</td><td>cell</td></tr></table>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<table><tr><th>col</th><th>col</th></tr><tr><td>cell</td><td>cell</td></tr></table>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<progress>', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<label>foo<progress></progress></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is aria-hidden', async () => {
    appendToBody('<progress aria-hidden="true"></progress>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<progress></progress>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<meter>', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<label>foo<meter></meter></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is aria-hidden', async () => {
    appendToBody('<meter aria-hidden="true"></meter>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<meter></meter>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<output>', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<label>foo<output></output></label>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report if it is aria-hidden', async () => {
    appendToBody('<output aria-hidden="true"></output>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<output></output>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<div role="dialog">', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<div role="dialog" aria-label="foo" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<div role="dialog" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('<div role="region">', () => {
  it('it does not report if it has a name', async () => {
    appendToBody('<div role="region" aria-label="foo" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if it does not have a name', async () => {
    const element = appendToBody('<div role="region" />');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
  });
});

describe('focusable', () => {
  describe('tabindex', () => {
    it('it does not report if it has a name', async () => {
      appendToBody('<div tabindex="-1" aria-label="foo">bar</div>');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports if it does not have a name', async () => {
      const element = appendToBody('<div tabindex="-1">bar</div>');
      await domChange;
      expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
    });
  });

  describe('contenteditable', () => {
    it('it does not report if it has a name', async () => {
      appendToBody('<div contenteditable="true" aria-label="foo">bar</div>');
      await domChange;
      expect(reporter).not.toHaveErrors();
    });

    it('reports if it does not have a name', async () => {
      const element = appendToBody('<div contenteditable="true">bar</div>');
      await domChange;
      expect(reporter).toHaveErrors({ message: 'element must have an accessible name', element });
    });
  });
});

// custom messages
// role of none?
