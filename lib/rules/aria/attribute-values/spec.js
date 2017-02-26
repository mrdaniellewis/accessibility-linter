proxy(fn => fn(window.AccessibilityLinter.config, 'ariaAttributes', {
  string: { values: { type: 'string' } },
  integer: { values: { type: 'integer' } },
  number: { values: { type: 'number' } },
  id: { values: { type: 'id' } },
  idlist: { values: { type: 'idlist' } },
  token: { values: { type: 'token', tokens: ['foo', 'bar', 'foe'] } },
  tokenlist: { values: { type: 'tokenlist', tokens: ['foo', 'bar', 'foe', 'thumb'], alone: ['foo'] } },
}));

it('does not generate an error for no attributes', when(() => {
  appendToBody('<div />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

it('does not generate an error for unknown attributes', when(() => {
  appendToBody('<div aria-unknown="" />');
}).then(() => {
  expect(logger).toNotHaveEntries();
}));

context('string attributes', () => {
  const message = 'aria-string must be a non-empty string';

  it('does not add an errors for valid attributes', when(() => {
    appendToBody('<div aria-string="foo" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-string />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-string="" />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for empty space', when(() => {
    el = appendToBody('<div aria-string=" " />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));
});

context('integer attributes', () => {
  const message = 'aria-integer must be an integer';

  it('does not add an errors for valid attributes', when(() => {
    appendToBody('<div aria-integer="1" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-integer />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-integer="" />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for an invalid number value', when(() => {
    el = appendToBody('<div aria-integer="1.2" />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error if there are spaces', when(() => {
    el = appendToBody('<div aria-integer="1 " />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('does not add an error for negative values', when(() => {
    el = appendToBody('<div aria-integer="-500" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('number attributes', () => {
  const message = 'aria-number must be a floating point number';

  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-number />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-number="" />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error for an invalid number value', when(() => {
    el = appendToBody('<div aria-number="abc" />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  it('adds an error if there are spaces', when(() => {
    el = appendToBody('<div aria-number="1 " />');
  }).then(() => {
    expect(logger).toHaveEntries([message, el]);
  }));

  Object.entries({ integer: '10',
    'decimal only': '.02',
    decimal: '10.02',
    negative: '-10.02',
    exponential: '10e2',
    'negative exponential': '10e-2',
    'positive exponential': '10e+2',
    'capital exponential': '10E2',
  }).forEach(([name, value]) => {
    it(`does not add an error for ${name} values`, when(() => {
      appendToBody(`<div aria-number="${value}" />`);
    }).then(() => {
      expect(logger).toNotHaveEntries();
    }));
  });
});

context('id attributes', () => {
  let id;

  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-id />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-id must be an element id', el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-id="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-id must be an element id', el]);
  }));

  it('adds an error for space characters', when(() => {
    el = appendToBody('<div aria-id="abc def" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-id must not contain spaces', el]);
  }));

  it('adds an error if the element cannot be found', when(() => {
    id = uniqueId();
    el = appendToBody(`<div aria-id="${id}" />`);
  }).then(() => {
    expect(logger).toHaveEntries([`aria-id no element can be found with an id of ${id}`, el]);
  }));

  it('does not add an error if the element can be found', when(() => {
    id = uniqueId();
    el = appendToBody(`<div aria-id="${id}" /><div id="${id}" />`);
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('idlist attributes', () => {
  let ids;

  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-idlist />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-idlist must be a list of one of more ids', el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-idlist="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-idlist must be a list of one of more ids', el]);
  }));

  it('adds an error for each element that cannot be found', when(() => {
    ids = [uniqueId(), uniqueId(), uniqueId()];
    el = appendToBody(`<div aria-idlist="${ids[0]} ${ids[1]} ${ids[2]}" /><div id="${ids[1]}" />`);
  }).then(() => {
    expect(logger).toHaveEntries(
      [`aria-idlist no element can be found with an id of ${ids[0]}`, el],
      [`aria-idlist no element can be found with an id of ${ids[2]}`, el]
    );
  }));

  it('does not add errors for elements that can be found', when(() => {
    const id = uniqueId();
    appendToBody(`<div aria-idlist="${id}" /><div id="${id}" />`);
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));
});

context('token attributes', () => {
  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-token />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-token must be one of: foo, bar, foe', el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-token="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-token must be one of: foo, bar, foe', el]);
  }));

  it('does not add errors for a valid value', when(() => {
    el = appendToBody('<div aria-token="bar" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for an invalid value', when(() => {
    el = appendToBody('<div aria-token="thumb" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-token must be one of: foo, bar, foe', el]);
  }));

  it('adds an error for multiple tokens', when(() => {
    el = appendToBody('<div aria-token="foo bar" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-token must be one of: foo, bar, foe', el]);
  }));
});

context('tokenlist attributes', () => {
  it('adds an error for a missing value', when(() => {
    el = appendToBody('<div aria-tokenlist />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-tokenlist must be one or more of: foo, bar, foe, thumb', el]);
  }));

  it('adds an error for an empty value', when(() => {
    el = appendToBody('<div aria-tokenlist="" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-tokenlist must be one or more of: foo, bar, foe, thumb', el]);
  }));

  it('does not add an error for allowed values', when(() => {
    el = appendToBody('<div aria-tokenlist="bar foe" />');
  }).then(() => {
    expect(logger).toNotHaveEntries();
  }));

  it('adds an error for invalid values', when(() => {
    el = appendToBody('<div aria-tokenlist="bar foe frog cow" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-tokenlist contains unknown values: frog, cow', el]);
  }));

  it('adds an error if alone values are used with others', when(() => {
    el = appendToBody('<div aria-tokenlist="foo bar" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-tokenlist should only contain the following values on their own: foo', el]);
  }));
});

context('multiple errors', () => {
  it('reports multiple aria attribute errors', when(() => {
    el = appendToBody('<div aria-string aria-integer="foo" />');
  }).then(() => {
    expect(logger).toHaveEntries(
      ['aria-string must be a non-empty string', el],
      ['aria-integer must be an integer', el]
    );
  }));
});

context('hidden elements', () => {
  it('reports errors on hidden elements', when(() => {
    el = appendToBody('<div aria-string style="display: none;" />');
  }).then(() => {
    expect(logger).toHaveEntries(['aria-string must be a non-empty string', el]);
  }));
});
