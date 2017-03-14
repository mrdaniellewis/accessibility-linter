it('is disabled by default', () => {
  const rule = new Rule();
  expect(rule.enabled).toEqual(false);
});

context('standard sized text', () => {
  it('does not add an error for a contrast of 4.5', () => {
    appendToBody('<div style="color: #767676; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('it adds an error for a contrast less than 4.5', () => {
    const el = appendToBody('<div style="color: #777; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 4.48:1', el]);
    });
  });
});

context('text larger than 18pt', () => {
  it('does not add an error for contrast of 3', () => {
    appendToBody('<div style="font-size: 18pt; color: #959595; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a contrast of less than 3', () => {
    const el = appendToBody('<div style="font-size: 18pt; color: #969696; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 2.96:1', el]);
    });
  });
});

context('text larger than 14pt and bold', () => {
  it('does not add an error for contrast of 3', () => {
    appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #959595; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a contrast of less than 3', () => {
    const el = appendToBody('<div style="font-size: 14pt; font-weight: bold; color: #969696; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 2.96:1', el]);
    });
  });
});

context('text larger than 14pt and not bold', () => {
  it('does not add an error for contrast of 3', () => {
    const el = appendToBody('<div style="font-size: 14pt; color: #959595; background-color: #fff;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 3:1', el]);
    });
  });
});

context('finding elements', () => {
  it('does not error for a hidden node', () => {
    appendToBody('<div style="color: #000; background-color: #000; display: none;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not error for a node with no text', () => {
    appendToBody('<div style="color: #000; background-color: #000;" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an for an aria-hidden node', () => {
    const el = appendToBody('<div aria-hidden="true" style="color: #000; background-color: #000;">foo</div>');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 1:1', el]);
    });
  });

  it('checks all elements in a sub tree', () => {
    const el = appendToBody(`<div>
      <div style="color: #000; background-color: #000">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
    </div>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(
        ['contrast is too low 1:1', el.children[0]],
        ['contrast is too low 1:1', el.children[1]]
      );
    });
  });

  it('does not check hidden subtrees', () => {
    appendToBody(`<div style="display: none;">
      <div style="color: #000; background-color: #000">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
    </div>`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('checks visible siblings following a hidden sibling', () => {
    const el = appendToBody(`<div>
      <div style="display: none;">foo</div>
      <div style="color: #000; background-color: #000">foo</div>
    </div>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(['contrast is too low 1:1', el.children[1]]);
    });
  });

  it('reports on the first ancestor element the styles are set on', () => {
    const el = appendToBody(`<div style="color: #000; background-color: #000">
      <div>foo</div>
      <div>foo</div>
    </div>`);
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries(
        ['contrast is too low 1:1', el.children[0]],
        ['contrast is too low 1:1', el.children[1]]
      );
    });
  });
});
