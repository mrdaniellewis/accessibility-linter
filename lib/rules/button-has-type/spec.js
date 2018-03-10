it('does not report buttons with a type', async () => {
  appendToBody('<button type="button" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports a button without a type', async () => {
  const element = appendToBody('<button />');
  await domChange;
  expect(reporter).toHaveErrors({ message: '<button> must have a type attribute', element });
});

