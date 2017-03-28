beforeEach(() => {
  linter.config.ariaAttributes = {
    string: { values: { type: 'string' } },
    integer: { values: { type: 'integer' } },
    number: { values: { type: 'number' } },
    id: { values: { type: 'id' } },
    idlist: { values: { type: 'idlist' } },
    token: { values: { type: 'token', tokens: ['foo', 'bar', 'foe'] } },
    tokenlist: { values: { type: 'tokenlist', tokens: ['foo', 'bar', 'foe', 'thumb'], alone: ['foo'] } },
  };
});

it('does not generate an error for no attributes', () => {
  appendToBody('<div />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

it('does not generate an error for unknown attributes', () => {
  appendToBody('<div aria-unknown="" />');
  return whenDomUpdates(() => {
    expect(logger).toNotHaveEntries();
  });
});

context('string attributes', () => {
  const message = 'aria-string must be a non-empty string';

  it('does not add an errors for valid attributes', () => {
    appendToBody('<div aria-string="foo" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-string />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-string="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for empty space', () => {
    const el = appendToBody('<div aria-string=" " />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });
});

context('integer attributes', () => {
  const message = 'aria-integer must be an integer';

  it('does not add an errors for valid attributes', () => {
    appendToBody('<div aria-integer="1" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-integer />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-integer="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for an invalid number value', () => {
    const el = appendToBody('<div aria-integer="1.2" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error if there are spaces', () => {
    const el = appendToBody('<div aria-integer="1 " />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('does not add an error for negative values', () => {
    appendToBody('<div aria-integer="-500" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('number attributes', () => {
  const message = 'aria-number must be a floating point number';

  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-number />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-number="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error for an invalid number value', () => {
    const el = appendToBody('<div aria-number="abc" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  it('adds an error if there are spaces', () => {
    const el = appendToBody('<div aria-number="1 " />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([message, el]);
    });
  });

  Object.entries({ integer: '10',
    'decimal only': '.02',
    decimal: '10.02',
    negative: '-10.02',
    exponential: '10e2',
    'negative exponential': '10e-2',
    'positive exponential': '10e+2',
    'capital exponential': '10E2',
  }).forEach(([name, value]) => {
    it(`does not add an error for ${name} values`, () => {
      appendToBody(`<div aria-number="${value}" />`);
      return whenDomUpdates(() => {
        expect(logger).toNotHaveEntries();
      });
    });
  });
});

context('id attributes', () => {
  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-id />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-id must be an element id', el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-id="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-id must be an element id', el]);
    });
  });


  it('adds an error for space characters', () => {
    const el = appendToBody('<div aria-id="abc def" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-id must not contain spaces', el]);
    });
  });

  it('adds an error if the element cannot be found', () => {
    const id = uniqueId();
    const el = appendToBody(`<div aria-id="${id}" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors([`aria-id no element can be found with an id of ${id}`, el]);
    });
  });

  it('does not add an error if the element can be found', () => {
    const id = uniqueId();
    appendToBody(`<div aria-id="${id}" /><div id="${id}" />`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('idlist attributes', () => {
  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-idlist />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-idlist must be a list of one of more ids', el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-idlist="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-idlist must be a list of one of more ids', el]);
    });
  });

  it('adds an error for each element that cannot be found', () => {
    const ids = [uniqueId(), uniqueId(), uniqueId()];
    const el = appendToBody(`<div aria-idlist="${ids[0]} ${ids[1]} ${ids[2]}" /><div id="${ids[1]}" />`);
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(
        [`aria-idlist no element can be found with an id of ${ids[0]}`, el],
        [`aria-idlist no element can be found with an id of ${ids[2]}`, el]
      );
    });
  });

  it('does not add errors for elements that can be found', () => {
    const id = uniqueId();
    appendToBody(`<div aria-idlist="${id}" /><div id="${id}" />`);
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });
});

context('token attributes', () => {
  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-token />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-token must be one of: foo, bar, foe', el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-token="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-token must be one of: foo, bar, foe', el]);
    });
  });

  it('does not add errors for a valid value', () => {
    appendToBody('<div aria-token="bar" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for an invalid value', () => {
    const el = appendToBody('<div aria-token="thumb" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-token must be one of: foo, bar, foe', el]);
    });
  });

  it('adds an error for multiple tokens', () => {
    const el = appendToBody('<div aria-token="foo bar" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-token must be one of: foo, bar, foe', el]);
    });
  });
});

context('tokenlist attributes', () => {
  it('adds an error for a missing value', () => {
    const el = appendToBody('<div aria-tokenlist />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-tokenlist must be one or more of: foo, bar, foe, thumb', el]);
    });
  });

  it('adds an error for an empty value', () => {
    const el = appendToBody('<div aria-tokenlist="" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-tokenlist must be one or more of: foo, bar, foe, thumb', el]);
    });
  });

  it('does not add an error for allowed values', () => {
    appendToBody('<div aria-tokenlist="bar foe" />');
    return whenDomUpdates(() => {
      expect(logger).toNotHaveEntries();
    });
  });

  it('adds an error for invalid values', () => {
    const el = appendToBody('<div aria-tokenlist="bar foe frog cow" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-tokenlist contains unknown values: frog, cow', el]);
    });
  });

  it('adds an error if alone values are used with others', () => {
    const el = appendToBody('<div aria-tokenlist="foo bar" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(['aria-tokenlist should only contain the following values on their own: foo', el]);
    });
  });
});

context('multiple errors', () => {
  it('reports multiple aria attribute errors', () => {
    const el = appendToBody('<div aria-string aria-integer="foo" />');
    return whenDomUpdates(() => {
      expect(logger).toHaveErrors(
        ['aria-string must be a non-empty string', el],
        ['aria-integer must be an integer', el]
      );
    });
  });
});
