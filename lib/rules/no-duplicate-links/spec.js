it('does not report links with different names', async () => {
  appendToBody(`
    <a href="#">foo</a>
    <a href="#">bar</a>
  `);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports links with the same name', async () => {
  const links = appendToBody(`<div>
    <a href="#">foo</a>
    <a href="#">foo</a>
  </div>`).querySelectorAll('a');
  await domChange;
  expect(reporter).toHaveErrors(
    { element: links[0], message: 'no duplicate link names' },
    { element: links[1], message: 'no duplicate link names' },
  );
});

it('reports links generated using the role attribute', async () => {
  const links = appendToBody(`<div>
    <a href="#">foo</a>
    <div role="link">foo</a>
  </div>`).querySelectorAll('a,[role=link]');
  await domChange;
  expect(reporter).toHaveErrors(
    { element: links[0], message: 'no duplicate link names' },
    { element: links[1], message: 'no duplicate link names' },
  );
});

it('uses the accessible name algorithm', async () => {
  const links = appendToBody(`<div>
    <a href="#">foo</a>
    <a href="#" aria-label="foo">bar</a>
  </div>`).querySelectorAll('a');
  await domChange;
  expect(reporter).toHaveErrors(
    { element: links[0], message: 'no duplicate link names' },
    { element: links[1], message: 'no duplicate link names' },
  );
});

it('ignores placeholder links', async () => {
  appendToBody(`<div>
    <a href="#">foo</a>
    <a>foo</a>
  </div>`).querySelectorAll('a');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('ignores hidden links', async () => {
  appendToBody(`<div>
    <a href="#">foo</a>
    <a hidden href="#">foo</a>
  </div>`).querySelectorAll('a');
  await domChange;
  expect(reporter).not.toHaveErrors();
});
