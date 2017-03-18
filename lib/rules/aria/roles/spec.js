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

it('does not generate an error for no role', () => {
  appendToBody('<test-restricted />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for an allowed role', () => {
  appendToBody('<test-restricted role="allowed1" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error for a missing role value', () => {
  const el = appendToBody('<test-restricted role />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['role attribute should not be empty', el]);
  });
});

context('using an implicit role', () => {
  it('adds an error', () => {
    const el = appendToBody('<test-restricted role="implicit" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "implicit" is implicit for this element and should not be specified', el]);
    });
  });
});

context('element allowing any role with implicit role', () => {
  it('adds an error for an implicit role', () => {
    const el = appendToBody('<test-implicit role="implicit" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "implicit" is implicit for this element and should not be specified', el]);
    });
  });
});

context('using an unknown role', () => {
  it('adds an error', () => {
    const el = appendToBody('<test-restricted role="unknown" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "unknown" is not a known role', el]);
    });
  });
});

context('using an abstract role', () => {
  it('adds an error', () => {
    const el = appendToBody('<test-restricted role="abstract" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "abstract" is an abstract role and should not be used', el]);
    });
  });
});

context('using a disallowed role', () => {
  it('adds an error', () => {
    const el = appendToBody('<test-restricted role="disallowed" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "disallowed" is not allowed for this element', el]);
    });
  });
});

context('element allowing any role', () => {
  it('does not add an error for a known role', () => {
    appendToBody('<test-any role="allowed1" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('using multiple roles', () => {
  it('does not add an error if multiple roles are valid', () => {
    appendToBody('<test-restricted role="allowed1 allowed2 " />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('it adds an error if any role is invalid', () => {
    const el = appendToBody('<test-restricted role="allowed1 invalid" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['role "invalid" is not a known role', el]);
    });
  });
});
