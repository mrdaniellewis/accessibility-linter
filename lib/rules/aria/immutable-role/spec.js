context('a role that does not change', () => {
  let el;

  beforeEach((done) => {
    el = appendToBody('<div role="button" />');
    window.setTimeout(() => done(), 0);
  });

  it('does not add an error', () => {
    el.classList.add('foo');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('a role that changes', () => {
  let el;

  beforeEach((done) => {
    el = appendToBody('<div role="button" />');
    window.setTimeout(() => done(), 0);
  });

  it('adds an error', () => {
    el.setAttribute('role', 'link');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['an elements role must not be modified', el]);
    });
  });
});

context('a newly added role', () => {
  let el;

  beforeEach((done) => {
    el = appendToBody('<div />');
    window.setTimeout(() => done(), 0);
  });

  it('does not add an error', () => {
    el.setAttribute('role', 'button');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});
