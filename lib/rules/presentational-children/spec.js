describe('for aria roles with presentational children', () => {
  it('does not report elements without interactive or content with a role', async () => {
    appendToBody('<div role="math"><span>foo</span></div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if elements contains focusable content', async () => {
    const element = appendToBody('<div role="math"><div tabindex="0" /></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <label>', async () => {
    const element = appendToBody('<div role="math"><label>foo</label></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <embed>', async () => {
    const element = appendToBody('<div role="math"><embed /></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports an element containing an explicit role', async () => {
    const element = appendToBody('<div role="math"><div role="tab" /></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element should not contain content with a role', element });
  });

  it('reports an element containing a heading', async () => {
    const element = appendToBody('<div role="math"><h1>foo</h1></div>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element should not contain content with a role', element });
  });
});

describe('a button', () => {
  it('does not report elements without interactive or content with a role', async () => {
    appendToBody('<button><span>foo</span></button>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if elements contains focusable content', async () => {
    const element = appendToBody('<button><div tabindex="0" /></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <label>', async () => {
    const element = appendToBody('<button><label>foo</label></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <embed>', async () => {
    const element = appendToBody('<button><embed /></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports an element containing an explicit role', async () => {
    const element = appendToBody('<button><div role="tab" /></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element should not contain content with a role', element });
  });

  it('reports an element containing a heading', async () => {
    const element = appendToBody('<button><h1>foo</h1></button>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element should not contain content with a role', element });
  });
});

describe('a link', () => {
  it('does not report elements without interactive or content with a role', async () => {
    appendToBody('<a href="#"><span>foo</span></a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report an element containing an explicit role', async () => {
    appendToBody('<a href="#"><div role="tab" /></a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report an element containing a heading', async () => {
    appendToBody('<a href="#"><h1>foo</h1></a>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports if elements contains focusable content', async () => {
    const element = appendToBody('<a href="#"><div tabindex="0" /></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <label>', async () => {
    const element = appendToBody('<a href="#"><label>foo</label></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

  it('reports elements containing a <embed>', async () => {
    const element = appendToBody('<a href="#"><embed /></a>');
    await domChange;
    expect(reporter).toHaveErrors({ message: 'element must not contain focusable or interactive elements', element });
  });

});
