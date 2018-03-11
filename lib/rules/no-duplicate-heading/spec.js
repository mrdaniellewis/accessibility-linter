it('does not report if not a heading', async () => {
  appendToBody('<div />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for a single heading', async () => {
  appendToBody('<h1>foo</h1>');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for a headings at different levels', async () => {
  appendToBody('<h1>foo</h1><h2>foo</h2><h3>foo</h3>');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for a headings with different parent headings (siblings)', async () => {
  appendToBody(`
    <h1>1</h1>
      <h2>1</h2>
      <h2>2</h2>
    <h1>2</h1>
      <h2>1</h2>
      <h2>2</h2>
  `);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for for a heading with different parent headings', async () => {
  appendToBody(`
    <section>
      <h1>1</h1>
      <section>
        <section>
          <h2>1</h2>
        </section>
        <section>
          <h2>2</h2>
        </section>
      </section>
    </section>
    <section>
      <h1>2</h1>
      <section>
        <section>
          <h2>1</h2>
        </section>
        <section>
          <h2>2</h2>
        </section>
      </section>
    </section>
  `);
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('reports headings at the same level (siblings)', async () => {
  const headings = appendToBody(`<div>
    <h1>1</h1>
      <h2>foo</h2>
        <h3>3</h3>
      <h2>foo</h2>
        <h3>3</h3>
      <h2>foo</h2>
        <h3>3</h3>
    <h1>2</h1>
      <h2>1</h2>
  </div>`).querySelectorAll('h2');
  await domChange;
  expect(reporter).toHaveErrors(
    { element: headings[1], message: 'no duplicate heading names' },
    { element: headings[2], message: 'no duplicate heading names' },
  );
});

it('reports headings at the same level', async () => {
  const headings = appendToBody(`<div>
    <section>
      <h1>1</h1>
      <section>
        <h2>foo</h2>
        <section>
          <h3>3</h3>
        </section>
      </section>
      <section>
        <h2>foo</h2>
        <section>
          <h3>3</h3>
        </section>
      </section>
      <section>
        <h2>foo</h2>
        <section>
          <h3>3</h3>
        </section>
      </section>
    </section>
      <h1>2</h1>
      <section>
        <h2>foo</h2>
        <section>
          <h3>3</h3>
        </section>
      </section>
    </section>
  </div>`).querySelectorAll('h2');
  await domChange;
  expect(reporter).toHaveErrors(
    { element: headings[1], message: 'no duplicate heading names' },
    { element: headings[2], message: 'no duplicate heading names' },
  );
});

describe('headings using role="heading"', () => {
  it('reports headings at the same level', async () => {
    const headings = appendToBody(`<div>
      <div role="heading" aria-level="1">1</div>
        <div role="heading">2</div>
          <div role="heading" aria-level="3">3</div>
        <div role="heading">2</div>
          <div role="heading" aria-level="3">3</div>
        <div role="heading">2</div>
          <div role="heading" aria-level="3">3</div>
      <div role="heading" aria-level="1">next</div>
        <div role="heading">2</div>
          <div role="heading" aria-level="3">3</div>
    </div>`).querySelectorAll('[role=heading]:not([aria-level])');
    await domChange;
    expect(reporter).toHaveErrors(
      { element: headings[1], message: 'no duplicate heading names' },
      { element: headings[2], message: 'no duplicate heading names' },
    );
  });
});

describe('name calculation', () => {
  it('uses the accessible name calculation', async () => {
    const headings = appendToBody(`<div>
      <h1 aria-label="2">foo</h2>
      <h1 aria-label="2">bar</h2>
    </div>`).querySelectorAll('h1');
    await domChange;
    expect(reporter).toHaveErrors({ element: headings[1], message: 'no duplicate heading names' });
  });
});

describe('hidden headings', () => {
  it('ignores hidden headings', async () => {
    const headings = appendToBody(`<div>
      <h1>1</h1>
      <h2>foo</h2>
      <h2>bar</h2>
      <h2 hidden>foo</h2>
      <h1 hidden>1</h1>
      <h2>foo</h2>
    </div>`).querySelectorAll('h2');
    await domChange;
    expect(reporter).toHaveErrors({ element: headings[3], message: 'no duplicate heading names' });
  });
});
