context('standard sized text', () => {
  it('does not report an element with sufficient contrast', async () => {
    appendToBody('<div style="color: #767676; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast less than 4.5', async () => {
    const element = appendToBody('<div style="color: #777; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 4.48:1, minimum 4.5:1' });
  });
});

context('text larger than 18pt', () => {
  it('does not report for a contrast of 3', async () => {
    appendToBody('<div style="font-size: 18pt; color: #959595; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast of less than 3', async () => {
    const element = appendToBody('<div style="font-size: 18pt; color: #969696; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 2.96:1, minimum 3:1' });
  });
});

context('text larger than 14pt and bold', () => {
  it('does not report for a contrast of 3', async () => {
    appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #959595; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast of less than 3', async () => {
    const element = appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #969696; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 2.96:1, minimum 3:1' });
  });
});

context('text larger than 14pt and not bold', () => {
  it('reports for contrast of 3', async () => {
    const element = appendToBody('<div style="font-size: 14pt; color: #959595; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 3:1, minimum 4.5:1' });
  });
});

context('finding elements', () => {
  it('does not report a hidden node', async () => {
    appendToBody('<div style="color: #000; background-color: #000; display: none;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not report nodes with no text', async () => {
    appendToBody('<div style="color: #000; background-color: #000;" />');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports only one element with each contrast', async () => {
    const elements = appendToBody(`<div>
      <div style="color: #000; background-color: #000">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
      <div style="color: #333; background-color: #000">foo</div>
      <div style="color: #333; background-color: #000">foo</div>
      <div style="color: #333; background-color: #000">foo</div>
    </div>`);
    await domChange;
    expect(reporter).toHaveErrors(
      { element: elements.children[0], message: 'contrast is too low 1:1, minimum 4.5:1, plus 1 more element' },
      { element: elements.children[2], message: 'contrast is too low 1.66:1, minimum 4.5:1, plus 2 more elements' },
    );
  });

  it('does not report hidden subtrees', async () => {
    appendToBody(`<div style="display: none;">
      <div style="color: #000; background-color: #000">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
    </div>`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports visible siblings following a hidden sibling', async () => {
    const element = appendToBody(`<div>
      <div style="display: none;">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
    </div>`);
    await domChange;
    expect(reporter).toHaveErrors({ element: element.children[1], message: 'contrast is too low 1:1, minimum 4.5:1' });
  });
});
