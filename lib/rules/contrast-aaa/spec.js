context('standard sized text', () => {
  it('does not report an element with sufficient contrast', async () => {
    appendToBody('<div style="color: #595959; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast less than 7', async () => {
    const element = appendToBody('<div style="color: #5a5a5a; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 6.9:1, minimum 7:1' });
  });
});

context('text larger than 18pt', () => {
  it('does not report for a contrast of 4.5', async () => {
    appendToBody('<div style="font-size: 18pt; color: #767676; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast of less than 4.5', async () => {
    const element = appendToBody('<div style="font-size: 18pt; color: #777; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 4.48:1, minimum 4.5:1' });
  });
});

context('text larger than 14pt and bold', () => {
  it('does not report for a contrast of 4.5', async () => {
    appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #767676; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports for a contrast of less than 4.5', async () => {
    const element = appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #777; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 4.48:1, minimum 4.5:1' });
  });
});

context('text larger than 14pt and not bold', () => {
  it('reports for contrast of 4.5', async () => {
    const element = appendToBody('<div style="font-size: 14pt; color: #767676; background-color: #fff;">foo</div>');
    await domChange;
    expect(reporter).toHaveErrors({ element, message: 'contrast is too low 4.54:1, minimum 7:1' });
  });
});

