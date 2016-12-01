let originalMatch;
let originalRoles;

before(() => {
  const aria = window.AccessibilityLinter.aria;
  originalRoles = aria.match;
  originalRoles = aria.roles;
  aria.match = (el) => {
    if (el.nodeName.toLowerCase() !== 'test') {
      throw new Error('expected test element');
    }

    return {
      implicitRoles: ['implicit'],
      allowedRoles: ['allowed1', 'allowed2'],
    };
  };

  aria.roles = { implicit: {}, allowed1: {}, allowed2: {}, disallowed: {} };
});

after(() => {
  window.AccessibilityLinter.aria.match = originalMatch;
  window.AccessibilityLinter.aria.roles = originalRoles;
});

it('does not generate an error for no role', when(() => {
  appendToBody('<test />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for an allowed role', when(() => {
  appendToBody('<test role="allowed1" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

context('missing attribute value', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role=" " />');
    expect(rule).toGenerateErrorMessage({ for: el }, 'role attribute should not be empty');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role=" " />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('using an implicit role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="implicit" />');
    expect(rule).toGenerateErrorMessage({ for: el }, 'role "implicit" is implicit for this element and should not be specified');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="implicit" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('using an unknown role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="unknown" />');
    expect(rule).toGenerateErrorMessage({ for: el }, '"unknown" is not a known role');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="unknown" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('using a disallowed role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="disallowed" />');
    expect(rule).toGenerateErrorMessage({ for: el }, 'role "disallowed" is not allowed for this element');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="disallowed" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
  }));
});

context('using multiple roles', () => {
  it('does not add an error if multiple roles are valid', when(() => {
    el = appendToBody('<test role="allowed1 allowed2 " />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('it adds an error if any role is invalid', when(() => {
    el = appendToBody('<test role="allowed1 invalid" />');
  }).then(() => {
    expect(logger).toHaveEntries([rule, el]);
    expect(rule).toGenerateErrorMessage({ for: el }, '"invalid" is not a known role');
  }));
});

