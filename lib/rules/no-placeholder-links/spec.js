context('<a>', () => {
  it('does not add an error for a link with a href', () => {
    appendToBody('<a href="foo" />');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('does not add an error for a hidden link', () => {
    appendToBody('<a hidden />');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a link without a href', () => {
    const el = appendToBody('<a />');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['links should have a href attribute', el]);
    });
  });
});

context('<area>', () => {
  it('does not add an error for a link with a href', () => {
    appendToBody('<area href="foo" />');

    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a link without a href', () => {
    const el = appendToBody('<area />');

    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['links should have a href attribute', el]);
    });
  });
});
