it('does not report if there is no name', async () => {
  appendToBody('<a />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report if the name is unique', async () => {
  appendToBody(`<a name="${uniqueId()}" />`);
  appendToBody(`<a name="${uniqueId()}" />`);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report if the name equals the id', async () => {
  const id = uniqueId();
  appendToBody(`<a name="${id}" id="${id}" />`);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports if the name is empty', async () => {
  const element = appendToBody('<a name="" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'name should not be empty', element });
});

it('reports if the name is not unique', async () => {
  const id = uniqueId();
  const el = appendToBody(`<a name="${id}" />`);
  const el2 = appendToBody(`<a name="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors(
    { message: 'name is not unique', element: el },
    { message: 'name is not unique', element: el2 },
  );
});

it('reports if the name is not unique to another id', async () => {
  const id = uniqueId();
  const el = appendToBody(`<a name="${id}" />`);
  appendToBody(`<div id="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: 'name is not unique', element: el });
});

it('reports if the name does not match the id', async () => {
  const el = appendToBody(`<a name="${uniqueId()}" id="${uniqueId()}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: 'if the id attribute is present it must equal the name attribute', element: el });
});

it('does not blow up if a name requires escaping', async () => {
  appendToBody('<a name="&quot; \\" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});
