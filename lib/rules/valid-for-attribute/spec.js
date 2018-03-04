it('does not report if there is no for attribute', async () => {
  appendToBody('<label />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
  it(`does not report if there is valid target of type ${name}`, async () => {
    const id = uniqueId();
    appendToBody(`<label for="${id}"><${name} id="${id}"></${name}>`);
    await domChange;
    expect(reporter).not.toHaveErrors();
  });
});

it('reports if the for attribute is empty', async () => {
  const element = appendToBody('<label for="" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'for attribute should not be empty', element });
});

[...' \t\n\f\r'].forEach((char) => {
  it(`reports if the list attribute contains space characters ${char.charCodeAt(0)}`, async () => {
    const element = appendToBody(`<label for="foo${char}bar" />`);
    await domChange;
    expect(reporter).toHaveErrors({ message: 'for attribute should not contain space characters', element });
  });
});

it('reports if there is no target', async () => {
  const id = uniqueId();
  const element = appendToBody(`<label for="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: `cannot find an element with id "${id}"`, element });
});

it('reports if the target is not a labelled element', async () => {
  const id = uniqueId();
  const element = appendToBody(`<label for="${id}" /><div id="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: 'for attribute does not point to a labelable element', element });
});

it('reports if the target is a hidden input', async () => {
  const id = uniqueId();
  const element = appendToBody(`<label for="${id}" /><input type="hidden" id="${id}" />`);
  await domChange;
  expect(reporter).toHaveErrors({ message: 'for attribute does not point to a labelable element', element });
});
