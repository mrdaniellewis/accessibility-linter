it('does not report if there is no id', async () => {
  appendToBody('<div />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report if ids are unique', async () => {
  appendToBody(`<div id="${uniqueId()}" />`);
  appendToBody(`<div id="${uniqueId()}" />`);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports if the id is empty', async () => {
  const element = appendToBody('<div id="" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'id should not be empty', element });
});

[...' \t\n\f\r'].forEach((char) => {
  it('reports if the id contains a space character', async () => {
    const element = appendToBody(`<div id="a${char}b" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: 'id should not contain space characters', element });
  });
});

it('reports if an id is not unique', async () => {
  const id = uniqueId();
  const el = appendToBody(`<div id="${id}" />`);
  const el2 = appendToBody(`<div id="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors(
    { message: 'id is not unique', element: el },
    { message: 'id is not unique', element: el2 },
  );
});

it('does not blow up if an id required escaping', async () => {
  appendToBody('<div id="&quot;\\" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});
