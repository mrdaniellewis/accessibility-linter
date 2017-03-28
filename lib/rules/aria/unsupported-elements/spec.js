beforeEach(() => {
  linter.config.roles = {
    implicit: {},
  };

  linter.config.elements = {
    'test-unsupported': { unsupported: true },
    'test-unsupported-no-implicit': { unsupported: true },
  };

  linter.config.allowedAria = {
    'test-unsupported': {
      selector: '*',
      implicit: ['implicit'],
      roles: '*',
    },
    'test-unsupported-no-implicit': {
      selector: '*',
      implicit: [],
      roles: '*',
    },
  };
});

it('does not generate an error for a supported element without a role', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for an unsupported element without a role', () => {
  appendToBody('<test-unsupported-no-implicit />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for an unsupported element with a role', () => {
  appendToBody('<test-unsupported role="foo" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('generates an error for an unsupported element without a role', () => {
  const el = appendToBody('<test-unsupported />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['element should have a role for backwards compatibility', el]);
  });
});
