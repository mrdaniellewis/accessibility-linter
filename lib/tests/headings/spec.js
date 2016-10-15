it('generates the expected error message', () => {
  expect(this.test).toGenerateErrorMessage('Headings must be nested correctly');
});

const heading = i => `<h${i}>heading</h${i}>`;

[2, 3, 4, 5, 6].forEach(h => {
  it(`it adds an error for a <h${h}> with no proceeding heading`, when(() => {
    el = appendToBody(`<h${h}>Heading</h${h}>`);
  }).then(() => {
    expect(logger).toHaveEntries([test, el]);
  }));

  [1, 2, 3, 4, 5, 6].forEach(p => {
    const errors = p + 1 < h;
    it(`it ${errors ? 'adds' : 'does not add'} an error for a sibling <h${h}> after a <h${p}>`, when(() => {
      for (let i = 1; i <= p; ++i) {
        appendToBody(`${heading(i)}<p>paragraph</p>text`);
      }
      el = appendToBody(heading(h));
    }).then(() => {
      if (errors) {
        expect(logger).toHaveEntries([test, el]);
      } else {
        expect(logger).toNotHaveEntries();
      }
    }));

    it(`it ${errors ? 'adds' : 'does not add'} an error for an ancestor <h${h}> after a <h${p}>`, when(() => {
      let $section = $('body');
      for (let i = 1; i <= p; ++i) {
        $section = $(`<section>${heading(i)}<p>paragraph</p>text</section>`).appendTo($section);
      }
      el = $(heading(h)).appendTo($section)[0];
    }).then(() => {
      if (errors) {
        expect(logger).toHaveEntries([test, el]);
      } else {
        expect(logger).toNotHaveEntries();
      }
    }));

    it(`it ${errors ? 'adds' : 'does not add'} an error for a <h${h}> after a <h${p}> in a parent`, when(() => {
      let $section = $('body');
      for (let i = 1; i <= p; ++i) {
        $section = $(`<section>${heading(i)}<p>paragraph</p>text</section>`).appendTo($section);
      }
      el = appendToBody(heading(h));
    }).then(() => {
      if (errors) {
        expect(logger).toHaveEntries([test, el]);
      } else {
        expect(logger).toNotHaveEntries();
      }
    }));
  });
});
