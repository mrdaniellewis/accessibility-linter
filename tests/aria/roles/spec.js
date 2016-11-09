let originalMatch;
let originalRoles;

before(() => {
  originalMatch = window.AccessibilityLinter.rules.match;
  originalRoles = window.AccessibilityLinter.rules.roles;
  window.AccessibilityLinter.rules.match = (el) => {
    if (el.nodeName.toLowerCase() !== 'test') {
      throw new Error('expected test element');
    }

    return {
      implicitRoles: ['implicit'],
      allowedRoles: ['allowed1', 'allowed2'],
    };
  };

  window.AccessibilityLinter.rules.roles = ['implicit', 'allowed1', 'allowed2', 'disallowed'];
});

after(() => {
  window.AccessibilityLinter.rules.match = originalMatch;
  window.AccessibilityLinter.rules.roles = originalRoles;
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
    expect(test).toGenerateErrorMessage({ for: el }, 'role "implicit" is implicit for this element and not allowed');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="implicit" />');
  }).then(() => {
    expect(logger).toHaveEntries([test, el]);
  }));
});

context('using an unknown role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="unknown" />');
    expect(test).toGenerateErrorMessage({ for: el }, 'role "unknown" is not a known role');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="unknown" />');
  }).then(() => {
    expect(logger).toHaveEntries([test, el]);
  }));
});

context('using a disallowed role', () => {
  it('generates the expected error message', () => {
    el = appendToBody('<test role="disallowed" />');
    expect(test).toGenerateErrorMessage({ for: el }, 'role "disallowed" is not allowed for this element');
  });

  it('adds an error', when(() => {
    el = appendToBody('<test role="disallowed" />');
  }).then(() => {
    expect(logger).toHaveEntries([test, el]);
  }));
});

