context('a role that does not change', () => {
  beforeEach((done) => {
    el = appendToBody('<div role="button" />');
    window.setTimeout(() => done(), 0);
  });

  it('does not add an error', when(() => {
    el.classList.add('foo');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('a role that changes', () => {
  beforeEach((done) => {
    el = appendToBody('<div role="button" />');
    window.setTimeout(() => done(), 0);
  });

  it('adds an error', when(() => {
    el.setAttribute('role', 'link');
  }).then(() => {
    expect(logger).toHaveEntries(['an elements role must not be modified', el]);
  }));

  it('adds an error for a hidden element', when(() => {
    el.style = 'display: none;';
    el.setAttribute('role', 'link');
  }).then(() => {
    expect(logger).toHaveEntries(['an elements role must not be modified', el]);
  }));
});

context('a newly added role', () => {
  beforeEach((done) => {
    el = appendToBody('<div />');
    window.setTimeout(() => done(), 0);
  });

  it('does not add an error', when(() => {
    el.setAttribute('role', 'button');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});
