const message = 'area with a href must have a label';

context('no valid image map', () => {
  it('does not add errors for an area that is not a descendant of a map', () => {
    appendToBody('<area href="#" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add errors for an area that is a descendant of a map with no name', () => {
    appendToBody('<map><area href="#" /></map>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add errors for an area that has no img', () => {
    appendToBody('<map name="imagemap"><area href="#" /></map>');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add errors for an area that has a hidden img', () => {
    appendToBody('<map name="imagemap"><area href="#" /></map><img src="#" usemap="#imagemap" aria-hidden="true" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('valid image map', () => {
  it('does not add errors for an area with no href', () => {
    appendToBody('<map name="imagemap"><area /></map><img src="#" usemap="#imagemap" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add errors for an area with href and label', () => {
    appendToBody('<map name="imagemap"><area href="#" alt="foo" /></map><img src="assets/flower.jpg" usemap="#imagemap" width="100" height="100" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does add errors for an area with href and no label', () => {
    const el = appendToBody('<map name="imagemap"><area href="#" /></map><img src="assets/flower.jpg" usemap="#imagemap" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveEntries([message, el.querySelector('area')]);
    });
  });
});
