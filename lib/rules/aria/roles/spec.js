proxy(fn => fn(window.AccessibilityLinter.config, 'roles', {
  implicit: {},
  allowed1: {},
  allowed2: {},
  disallowed: {},
  abstract: { abstract: true },
}));

proxy(fn => fn(window.AccessibilityLinter.config, 'allowedAria', {
  'test-restricted': {
    selector: '*',
    implicit: ['implicit'],
    roles: ['allowed1', 'allowed2'],
  },
  'test-any': {
    selector: '*',
    implicit: [],
    roles: '*',
  },
  'test-implicit': {
    selector: '*',
    implicit: ['implicit'],
    roles: '*',
  },
}));

it('does not generate an error for no role', when(() => {
  appendToBody('<test-restricted />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for an allowed role', when(() => {
  appendToBody('<test-restricted role="allowed1" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

context('missing attribute value', () => {
  it('adds an error', when(() => {
    el = appendToBody('<test-restricted role=" " />');
  }).then(() => {
    expect(logger).toHaveEntries(['role attribute should not be empty', el]);
  }));
});

context('using an implicit role', () => {
  it('adds an error', when(() => {
    el = appendToBody('<test-restricted role="implicit" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "implicit" is implicit for this element and should not be specified', el]);
  }));
});

context('element allowing any role with implicit role', () => {
  it('adds an error for an implicit role', when(() => {
    el = appendToBody('<test-implicit role="implicit" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "implicit" is implicit for this element and should not be specified', el]);
  }));
});

context('using an unknown role', () => {
  it('adds an error', when(() => {
    el = appendToBody('<test-restricted role="unknown" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "unknown" is not a known role', el]);
  }));
});

context('using an abstract role', () => {
  it('adds an error', when(() => {
    el = appendToBody('<test-restricted role="abstract" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "abstract" is an abstract role and should not be used', el]);
  }));
});

context('using a disallowed role', () => {
  it('adds an error', when(() => {
    el = appendToBody('<test-restricted role="disallowed" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "disallowed" is not allowed for this element', el]);
  }));
});

context('element allowing any role', () => {
  it('does not add an error for a known role', when(() => {
    el = appendToBody('<test-any role="allowed1" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('using multiple roles', () => {
  it('does not add an error if multiple roles are valid', when(() => {
    el = appendToBody('<test-restricted role="allowed1 allowed2 " />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('it adds an error if any role is invalid', when(() => {
    el = appendToBody('<test-restricted role="allowed1 invalid" />');
  }).then(() => {
    expect(logger).toHaveEntries(['role "invalid" is not a known role', el]);
  }));
});