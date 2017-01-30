it('generates the expected error message', () => {
  expect(rule).toGenerateErrorMessage('element must have a label');
});

context('no valid image map', () => {
  it('does not add errors for an area that is not a descendant of a map', when(() => {
    appendToBody('<area href="#" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add errors for an area that is a descendant of a map with no name', when(() => {
    appendToBody('<map><area href="#" /></map>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add errors for an area that has no img', when(() => {
    appendToBody('<map name="imagemap"><area href="#" /></map>');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add errors for an area that has a hidden img', when(() => {
    appendToBody('<map name="imagemap"><area href="#" /></map><img src="#" usemap="#imagemap" aria-hidden="true" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('valid image map', () => {
  it('does not add errors for an area with no href', when(() => {
    appendToBody('<map name="imagemap"><area /></map><img src="#" usemap="#imagemap" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does not add errors for an area with href and label', when(() => {
    appendToBody('<map name="imagemap"><area href="#" alt="foo" /></map><img src="assets/flower.jpg" usemap="#imagemap" width="100" height="100" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('does add errors for an area with href and no label', when(() => {
    el = appendToBody('<map name="imagemap"><area href="#" /></map><img src="assets/flower.jpg" usemap="#imagemap" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el.querySelector('area')]);
  }));
});
