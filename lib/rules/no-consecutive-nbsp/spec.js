it('does not report single nbsp', async () => {
  appendToBody('<p>&#160;</p>');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports consecutive nbsp', async () => {
  const element = appendToBody('<p>&#160;&#160;</p>');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'no consecutive non-breaking spaces', element });
});

it('reports consecutive nbsp separated by spaces', async () => {
  const element = appendToBody('<p>&#160;  &#160;</p>');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'no consecutive non-breaking spaces', element });
});

