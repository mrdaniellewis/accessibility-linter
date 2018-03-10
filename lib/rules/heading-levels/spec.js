const message = 'headings must be nested correctly';
const heading = i => `<h${i}>heading</h${i}>`;

it('does not report if not a heading', async () => {
  appendToBody('<div />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

it('does not report for h1', async () => {
  appendToBody('<h1 />');
  await domChange;
  expect(reporter).not.toHaveErrors();
});

[2, 3, 4, 5, 6].forEach((h) => {
  it(`it reports a <h${h}> with no proceeding heading`, async () => {
    const element = appendToBody(`<h${h}>Heading</h${h}>`);
    await domChange;
    expect(reporter).toHaveErrors({ element, message });
  });

  [1, 2, 3, 4, 5, 6].forEach((p) => {
    const errors = p + 1 < h;
    it(`${errors ? 'reports' : 'does not report'} for a sibling <h${h}> after a <h${p}>`, async () => {
      for (let i = 1; i <= p; ++i) {
        appendToBody(`${heading(i)}<p>paragraph</p>text`);
      }
      const element = appendToBody(heading(h));
      await domChange;
      if (errors) {
        expect(reporter).toHaveErrors({ message, element });
      } else {
        expect(reporter).not.toHaveErrors();
      }
    });

    it(`${errors ? 'reports' : 'does not report'} for an ancestor <h${h}> after a <h${p}>`, async () => {
      let section = document.body;
      for (let i = 1; i <= p; ++i) {
        section = section.appendChild(buildHtml(`<section>${heading(i)}<p>paragraph</p>text</section>`));
      }
      const element = buildHtml(heading(h));
      section.appendChild(element);
      await domChange;
      if (errors) {
        expect(reporter).toHaveErrors({ message, element });
      } else {
        expect(reporter).not.toHaveErrors();
      }
    });

    it(`${errors ? 'reports' : 'does not report'} for a <h${h}> after a <h${p}> in a parent`, async () => {
      let section = document.body;
      for (let i = 1; i <= p; ++i) {
        section = section.appendChild(buildHtml(`<section>${heading(i)}<p>paragraph</p>text</section>`));
      }
      const element = appendToBody(heading(h));
      await domChange;
      if (errors) {
        expect(reporter).toHaveErrors({ message, element });
      } else {
        expect(reporter).not.toHaveErrors();
      }
    });
  });
});

describe('headings using role="heading"', () => {
  it('does not report a correctly nested heading', async () => {
    appendToBody('<div role="heading" aria-level="1">heading</h1>');
    appendToBody('<div role="heading" aria-level="2">heading</div>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('reports an incorrectly nested heading', async () => {
    appendToBody('<div role="heading" aria-level="1">heading</h1>');
    const element = appendToBody('<div role="heading" aria-level="3">heading</div>');
    await domChange;
    expect(reporter).toHaveErrors({ message, element });
  });

  it('defaults an element with a heading role to level 2', async () => {
    const element = appendToBody('<div role="heading" aria-level="2">heading</div>');
    appendToBody('<div role="heading" aria-level="1">heading</div>');
    appendToBody('<div role="heading" aria-level="2">heading</div>');
    await domChange;
    expect(reporter).toHaveErrors({ message, element });
  });
});

describe('hidden headings', () => {
  it('does not report for a hidden heading', async () => {
    appendToBody('<h2 hidden>heading</h2>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });

  it('does not take hidden headings into account when finding errors', async () => {
    appendToBody('<h1>heading</h1>');
    appendToBody('<h2>heading</h2>');
    appendToBody('<h1 hidden>heading</h1>');
    appendToBody('<h3>heading</h3>');
    await domChange;
    expect(reporter).not.toHaveErrors();
  });
});
