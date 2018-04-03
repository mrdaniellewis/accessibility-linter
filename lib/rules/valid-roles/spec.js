it('does not report no role', async () => {
  appendToBody('<div />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report a valid role', async () => {
  appendToBody('<div role="alert" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report multiple valid roles', async () => {
  appendToBody('<div role="alert combobox" />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports an empty role attribute', async () => {
  const element = appendToBody('<div role />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role attribute should not be empty', element });
});

it('reports uppercase role', async () => {
  const element = appendToBody('<div role="aLeRt" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role "aLeRt" should be lowercase', element });
});

it('reports unknown roles', async () => {
  const element = appendToBody('<div role="foo" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role "foo" is not a known role', element });
});

it('reports abstract roles', async () => {
  const element = appendToBody('<div role="command" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role "command" is an abstract role and should not be used', element });
});

it('reports implicit roles', async () => {
  const element = appendToBody('<input role="textbox" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role "textbox" is implicit for this element and should not be specified', element });
});

it('reports disallowed roles', async () => {
  const element = appendToBody('<input role="alert" />');
  await domChange;
  expect(reporter).toHaveErrors({ message: 'role "alert" is not allowed on this element', element });
});

it('reports multiple errors', async () => {
  const element = appendToBody('<input role="FoO Command alert" />');
  await domChange;
  expect(reporter).toHaveErrors(
    { message: 'role "FoO" should be lowercase', element },
    { message: 'role "Command" should be lowercase', element },
    { message: 'role "foo" is not a known role', element },
    { message: 'role "command" is an abstract role and should not be used', element },
    { message: 'role "alert" is not allowed on this element', element },
  );
});
