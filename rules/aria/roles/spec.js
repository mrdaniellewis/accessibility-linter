let originalMatch;
let originalRoles;

before(() => {
  const aria = window.AccessibilityLinter.standards.aria;
  originalMatch = aria.match;
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

  aria.roles = ['implicit', 'allowed1', 'allowed2', 'disallowed'];
});

after(() => {
  window.AccessibilityLinter.standards.aria.match = originalMatch;
  window.AccessibilityLinter.standards.aria.roles = originalRoles;
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

context('using an implicit role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="implicit" />');
    expect(rule).toGenerateErrorMessage({ for: el }, 'role "implicit" is implicit for this element and not allowed');
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
    expect(rule).toGenerateErrorMessage({ for: el }, 'role "unknown" is not a known role');
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

