beforeEach(() => {
  linter.config.roles = Object.assign(linter.config.roles, {
    test: {
      allowed: ['allowed', 'permitted'],
    },
  });

  linter.config.ariaAttributes = Object.assign(linter.config.ariaAttributes, {
    global: {
      global: true,
    },
    universal: {
      global: true,
    },
    other: {},
    allowed: {},
    permitted: {},
  });

  linter.config.allowedAria = Object.assign(linter.config.allowedAria, {
    'test-any-role': {
      selector: '*',
      implicit: [],
      roles: '*',
    },
    'test-implicit-with-aria': {
      selector: '*',
      implicit: ['test'],
      roles: [],
      ariaForImplicit: true,
    },
    'test-implicit-without-aria': {
      selector: '*',
      implicit: ['test'],
      roles: [],
      ariaForImplicit: false,
    },
    'test-no-aria': {
      selector: '*',
      implicit: [],
      roles: [],
      noAria: true,
    },
  });
});

it('does not add an error if there are no aria attributes', () => {
  appendToBody('<test-any-role />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if a valid global attribute is used', () => {
  appendToBody('<test-any-role aria-global="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if a valid role attribute is used', () => {
  appendToBody('<test-any-role role="test" aria-allowed="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if a valid implicit role attribute is used', () => {
  appendToBody('<test-implicit-with-aria aria-allowed="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('adds an error if an unknown aria attributes is used', () => {
  const el = appendToBody('<test-any-role aria-unknown="true" aria-unrecognised />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      ['aria-unknown is not a known aria attribute', el],
      ['aria-unrecognised is not a known aria attribute', el]
    );
  });
});

it('adds an error if global aria attributes are added to elements that do not allow any', () => {
  const el = appendToBody('<test-no-aria aria-global="true" aria-universal />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no aria attributes are allowed on element. Found aria-global, aria-universal', el]);
  });
});

it('adds an error if role based aria attributes are added to a role that does not support them', () => {
  const el = appendToBody('<test-any-role aria-allowed="true" aria-permitted />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      ['aria-allowed is not allowed on this element', el],
      ['aria-permitted is not allowed on this element', el]
    );
  });
});

it('adds an error if role based aria attributes are added for an implicit role that does not allow implicit attributes', () => {
  const el = appendToBody('<test-implicit-without-aria aria-allowed="true" aria-permitted />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      ['aria-allowed is not allowed on this element', el],
      ['aria-permitted is not allowed on this element', el]
    );
  });
});

it('adds an error if aria attributes are added to an element with a none role', () => {
  const el = appendToBody('<test-any-role role="none" aria-global="true" aria-universal />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no aria attributes should be added for a role of none. Found aria-global, aria-universal', el]);
  });
});

it('adds an error if aria attributes are added to an element with a presentation role', () => {
  const el = appendToBody('<test-any-role role="presentation" aria-global="true" aria-universal />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['no aria attributes should be added for a role of presentation. Found aria-global, aria-universal', el]);
  });
});

['input', 'button', 'select', 'optgroup', 'textarea', 'fieldset'].forEach((name) => {
  it(`adds an error if aria-disabled is used on ${name}`, () => {
    const el = appendToBody(`<${name} aria-disabled="true" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['do not include aria-disabled on elements with a native disabled attribute', el]);
    });
  });
});

it('adds an error if aria-hidden is used on an element with the hidden attribute', () => {
  const el = appendToBody('<div hidden aria-hidden="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not include aria-hidden on elements with a hidden attribute', el]);
  });
});

it('adds an error if aria-readonly is used on textarea', () => {
  const el = appendToBody('<textarea aria-readonly="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not include aria-readonly on elements with a native readonly attribute', el]);
  });
});

['text', 'url', 'email'].forEach((type) => {
  it(`adds an error if aria-readonly is used on an input of type ${type}`, () => {
    const el = appendToBody(`<input type="${type}" aria-readonly="true" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['do not include aria-readonly on elements with a native readonly attribute', el]);
    });
  });
});

it('adds an error if aria-readonly is used on an element with contenteditable="true"', () => {
  const el = appendToBody('<div role="treegrid" contenteditable="true" aria-readonly="true" />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not include aria-readonly="true" on elements with contenteditable', el]);
  });
});

it('adds an error if aria-readonly is used on an element with inherited contenteditable="true"', () => {
  const el = appendToBody('<div contenteditable="true"><span role="treegrid" aria-readonly="true" /></div>')
    .querySelector('span');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(['do not include aria-readonly="true" on elements with contenteditable', el]);
  });
});

it('does not add an error if aria-readonly is used on an element with contenteditable="false"', () => {
  appendToBody('<div role="treegrid" contenteditable="false" aria-readonly="true" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not add an error if aria-readonly is used on an element with inherited contenteditable="false"', () => {
  appendToBody('<div contenteditable="true"><div contenteditable="false"><span role="treegrid" aria-readonly="true" /></div></div>');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

['input', 'textarea'].forEach((name) => {
  it(`adds an error if aria-placeholder is used on ${name}`, () => {
    const el = appendToBody(`<${name} aria-placeholder="true" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['do not include aria-placeholder on elements with a native placeholder attribute', el]);
    });
  });
});

['input', 'select', 'textarea'].forEach((name) => {
  it(`adds an error if aria-required=false is used with required on ${name}`, () => {
    const el = appendToBody(`<${name} aria-required="false" required />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['do not set aria-required to false if the required attribute is set', el]);
    });
  });

  it(`does not add an error if aria-required=true is used with required on ${name}`, () => {
    appendToBody(`<${name} aria-required="true" required />`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

it('adds an errors if disallowed aria attributes are used on an element', () => {
  const el = appendToBody('<div aria-required aria-placeholder aria-readonly />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      ['aria-required is not allowed on this element', el],
      ['aria-placeholder is not allowed on this element', el],
      ['aria-readonly is not allowed on this element', el]
    );
  });
});

it('adds multiple errors to an element', () => {
  const el = appendToBody('<input aria-foo aria-placeholder="foo" aria-readonly="true" aria-required="false" required />');
  return whenDomUpdates(() => {
    expect(logger).toHaveErrors(
      ['aria-foo is not a known aria attribute', el],
      ['do not include aria-readonly on elements with a native readonly attribute', el],
      ['do not include aria-placeholder on elements with a native placeholder attribute', el],
      ['do not set aria-required to false if the required attribute is set', el]
    );
  });
});

