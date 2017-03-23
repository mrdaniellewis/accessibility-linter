const message = 'headings must be nested correctly';
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

describe('headings using role="heading"', () => {
  it('does not add an error for a correctly nested heading', () => {
    appendToBody('<div role="heading" aria-level="1">heading</h1>');
    appendToBody('<div role="heading" aria-level="2">heading</div>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for an incorrectly nested heading', () => {
    appendToBody('<div role="heading" aria-level="1">heading</h1>');
    const el = appendToBody('<div role="heading" aria-level="3">heading</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('defaults an element with a heading role to level 2', () => {
    const el = appendToBody('<div role="heading" aria-level="2">heading</div>');
    appendToBody('<div role="heading" aria-level="1">heading</div>');
    appendToBody('<div role="heading" aria-level="2">heading</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for headings with multiple roles', () => {
    const el = appendToBody('<div role="heading none" aria-level="2">heading</div>');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });
});

describe('hidden headings', () => {
  it('does not add an error for a hidden heading', () => {
    appendToBody('<h2 style="display: none;">heading</h2>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not take hidden headings into account when finding errors', () => {
    appendToBody('<h1>heading</h1>');
    appendToBody('<h2>heading</h2>');
    appendToBody('<h1 style="display: none;">heading</h1>');
    appendToBody('<h3>heading</h3>');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('performance', () => {
  it('stops iterating at the body element', () => {
    const spyBody = expect.spyOn(document.body, 'matches').andCallThrough();
    const spyHead = expect.spyOn(document.head, 'matches').andCallThrough();
    appendToBody('<h1>heading</h1>');
    return whenDomUpdates(() => {
      expect(spyBody).toHaveBeenCalled();
      expect(spyHead).toNotHaveBeenCalled();
    });
  });
});
