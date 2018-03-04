it('does not report a single br', async () => {
  appendToBody('<br />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report brs separated by text', async () => {
  appendToBody('line 1<br />line 2<br />town');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports the last consecutive <br>', async () => {
  const element = appendToBody('<p><br /><br /><br /></p>').querySelectorAll('br')[2];
  await domChange;
  expect(reporter).toHaveErrors({ message: 'no consecutive <br> elements', element });
});

it('reports consecutive <br> separated by white space', async () => {
  const element = appendToBody('<p><br /> <br /> <br /></p>').querySelectorAll('br')[2];
  await domChange;
  expect(reporter).toHaveErrors({ message: 'no consecutive <br> elements', element });
});

it('reports consecutive <br> separated by white space and nbsp', async () => {
  const element = appendToBody('<p><br /> &nbsp; <br />&nbsp; &nbsp;<br /></p>').querySelectorAll('br')[2];
  await domChange;
  expect(reporter).toHaveErrors({ message: 'no consecutive <br> elements', element });
});

it('reports multiple sibling consecutive <br>s', async () => {
  const elements = appendToBody('<p><br /><br />foo<br /><br /></p>').querySelectorAll('br');
  await domChange;
  expect(reporter).toHaveErrors(
    { message: 'no consecutive <br> elements', element: elements[1] },
    { message: 'no consecutive <br> elements', element: elements[3] },
  );
});
