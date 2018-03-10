it('does not report a link with a href', async () => {
  const foo = appendToBody('<a href="#" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report a link with an empty href', async () => {
  const foo = appendToBody('<a href="#" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports a link with no href', async () => {
  const element = appendToBody('<a />');
  await domChange;
  expect(reporter).toHaveErrors({ element, message: 'no placeholder links' });
});
