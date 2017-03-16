const message = 'Headings must be nested correctly';
const heading = i => `<h${i}>heading</h${i}>`;

[2, 3, 4, 5, 6].forEach((h) => {
  it(`it adds an error for a <h${h}> with no proceeding heading`, () => {
    const el = appendToBody(`<h${h}>Heading</h${h}>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  [1, 2, 3, 4, 5, 6].forEach((p) => {
    const errors = p + 1 < h;
    it(`it ${errors ? 'adds' : 'does not add'} an error for a sibling <h${h}> after a <h${p}>`, () => {
      for (let i = 1; i <= p; ++i) {
        appendToBody(`${heading(i)}<p>paragraph</p>text`);
      }
      const el = appendToBody(heading(h));
      return whenDomUpdates(() => {
        if (errors) {
          expect(logger).toHaveErrors([message, el]);
        } else {
          expect(logger).toNotHaveEntries();
        }
      });
    });

    it(`it ${errors ? 'adds' : 'does not add'} an error for an ancestor <h${h}> after a <h${p}>`, () => {
      let section = document.body;
      for (let i = 1; i <= p; ++i) {
        section = section.appendChild(buildHtml(`<section>${heading(i)}<p>paragraph</p>text</section>`));
      }
      const el = buildHtml(heading(h));
      section.appendChild(el);
      return whenDomUpdates(() => {
        if (errors) {
          expect(logger).toHaveErrors([message, el]);
        } else {
          expect(logger).toNotHaveEntries();
        }
      });
    });

    it(`it ${errors ? 'adds' : 'does not add'} an error for a <h${h}> after a <h${p}> in a parent`, () => {
      let section = document.body;
      for (let i = 1; i <= p; ++i) {
        section = section.appendChild(buildHtml(`<section>${heading(i)}<p>paragraph</p>text</section>`));
      }
      const el = appendToBody(heading(h));
      return whenDomUpdates(() => {
        if (errors) {
          expect(logger).toHaveErrors([message, el]);
        } else {
          expect(logger).toNotHaveEntries();
        }
      });
    });
  });
});
