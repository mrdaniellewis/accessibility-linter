it('does not report if there is no list attribute', async () => {
  appendToBody('<input />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

['', 'text', 'search', 'url', 'telephone', 'email', 'number', 'range', 'date', 'month', 'week', 'time', 'datetime-local', 'color'].forEach((type) => {
  it(`does not report if there is a valid datalist for input type "${type}"`, async () => {
    const id = uniqueId();
    appendToBody(`<datalist id="${id}"></datalist><input ${type ? `type="${type}" ` : ''}list="${id}" />`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });
});

['hidden', 'checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].forEach((type) => {
  it(`reports if list attribute is used on input type "${type}"`, async () => {
    const element = appendToBody(`<input type="${type}" list="foo" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: 'list attribute is not valid for this input type', element });
  });
});

it('reports if the list attribute is empty', async () => {
  const element = appendToBody('<input list="" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'list attribute should not be empty', element });
});

[...' \t\n\f\r'].forEach((char) => {
  it(`reports if the list attribute contains space characters ${char.charCodeAt(0)}`, async () => {
    const element = appendToBody(`<input list="foo${char}bar" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: 'list attribute should not contain space characters', element });
  });
});

it('reports if there is no datalist', async () => {
  const id = uniqueId();
  const element = appendToBody(`<input list="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: `cannot find <datalist> with id "${id}"`, element });
});

it('reports if the target is not a datalist', async () => {
  const id = uniqueId();
  const element = appendToBody(`<input list="${id}" /><div id="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: 'list attribute does not point to a <datalist> element', element });
});

