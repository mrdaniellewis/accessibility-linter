it('reports a <foo> element', async () => {
  const foo = appendToBody('<foo />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'do not use the <foo> element', element: foo });
});

it('does not report for other elements', async () => {
  appendToBody('<div />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});
