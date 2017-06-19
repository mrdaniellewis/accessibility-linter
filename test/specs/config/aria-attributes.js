describe('#ariaAttributes', () => {
  const allAttributes = [
    'activedescendant',
    'atomic',
    'autocomplete',
    'busy',
    'checked',
    'colcount',
    'colindex',
    'colspan',
    'controls',
    'current',
    'describedby',
    'details',
    'disabled',
    'dropeffect',
    'errormessage',
    'expanded',
    'flowto',
    'grabbed',
    'haspopup',
    'hidden',
    'invalid',
    'keyshortcuts',
    'label',
    'labelledby',
    'level',
    'live',
    'modal',
    'multiline',
    'multiselectable',
    'orientation',
    'owns',
    'placeholder',
    'posinset',
    'pressed',
    'readonly',
    'relevant',
    'required',
    'roledescription',
    'rowcount',
    'rowindex',
    'rowspan',
    'selected',
    'setsize',
    'sort',
    'valuemax',
    'valuemin',
    'valuenow',
    'valuetext',
  ];

  const deprecatedAttributes = [
    'dropeffect',
    'grabbed',
  ];

  const globalAttributes = [
    'atomic',
    'busy',
    'controls',
    'current',
    'describedby',
    'details',
    'disabled',
    'dropeffect',
    'errormessage',
    'flowto',
    'grabbed',
    'haspopup',
    'hidden',
    'invalid',
    'keyshortcuts',
    'label',
    'labelledby',
    'live',
    'owns',
    'relevant',
    'roledescription',
  ];

  let ariaAttributes;
  beforeEach(() => {
    ariaAttributes = new AccessibilityLinter.Config().ariaAttributes;
  });

  it('is an object whose keys are all possible attributes', () => {
    expect(Object.keys(ariaAttributes)).toMatchArray(allAttributes);
  });

  it('has the correct attributes marked as deprecated', () => {
    expect(Object.keys(ariaAttributes).filter(name => ariaAttributes[name].deprecated))
      .toMatchArray(deprecatedAttributes);
  });

  it('has the correct attributes marked as global', () => {
    expect(Object.keys(ariaAttributes).filter(name => ariaAttributes[name].global))
      .toMatchArray(globalAttributes);
  });

  describe('allowed values', () => {
    ['atomic', 'busy', 'disabled', 'modal', 'multiline', 'multiselectable', 'readonly', 'required'].forEach((name) => {
      it(`allows true/false for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'token', tokens: ['true', 'false'] });
      });
    });

    ['checked', 'pressed'].forEach((name) => {
      it(`allows true/false/mixed/undefined for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'token', tokens: ['true', 'false', 'mixed', 'undefined'] });
      });
    });

    ['expanded', 'grabbed', 'hidden', 'selected'].forEach((name) => {
      it(`allows true/false/undefined for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'token', tokens: ['true', 'false', 'undefined'] });
      });
    });

    ['activedescendant', 'details', 'errormessage'].forEach((name) => {
      it(`allows ids for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'id' });
      });
    });

    ['controls', 'describedby', 'flowto', 'labelledby', 'owns'].forEach((name) => {
      it(`allows an id list for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'idlist' });
      });
    });

    ['colcount', 'colindex', 'colspan', 'level', 'posinset', 'rowcount', 'rowindex', 'rowspan', 'setsize'].forEach((name) => {
      it(`allows an integer for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'integer' });
      });
    });

    ['valuemax', 'valuemin', 'valuenow'].forEach((name) => {
      it(`allows an number for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'number' });
      });
    });

    ['keyshortcuts', 'label', 'placeholder', 'roledescription', 'valuetext'].forEach((name) => {
      it(`allows a string for ${name}`, () => {
        expect(ariaAttributes[name].values).toEqual({ type: 'string' });
      });
    });

    it('allows the expected values for autocomplete', () => {
      expect(ariaAttributes.autocomplete.values).toEqual({ type: 'token', tokens: ['inline', 'list', 'both', 'none'] });
    });

    it('allows the expected values for current', () => {
      expect(ariaAttributes.current.values).toEqual({ type: 'token', tokens: ['page', 'step', 'location', 'date', 'time', 'true', 'false'] });
    });

    it('allows the expected values for haspopup', () => {
      expect(ariaAttributes.haspopup.values).toEqual({ type: 'token', tokens: ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'] });
    });

    it('allows the expected values for invalid', () => {
      expect(ariaAttributes.invalid.values).toEqual({ type: 'token', tokens: ['grammar', 'false', 'spelling', 'true'] });
    });

    it('allows the expected values for live', () => {
      expect(ariaAttributes.live.values).toEqual({ type: 'token', tokens: ['assertive', 'off', 'polite'] });
    });

    it('allows the expected values for orientation', () => {
      expect(ariaAttributes.orientation.values).toEqual({ type: 'token', tokens: ['horizontal', 'undefined', 'vertical'] });
    });

    it('allows the expected values for sort', () => {
      expect(ariaAttributes.sort.values).toEqual({ type: 'token', tokens: ['ascending', 'descending', 'none', 'other'] });
    });

    it('allows the expected values for dropeffect', () => {
      expect(ariaAttributes.dropeffect.values).toEqual({ type: 'tokenlist', tokens: ['copy', 'execute', 'link', 'move', 'none', 'popup'], alone: ['none'] });
    });

    it('allows the expected values for relevant', () => {
      expect(ariaAttributes.relevant.values).toEqual({ type: 'tokenlist', tokens: ['additions', 'all', 'removals', 'text'], alone: ['all'] });
    });
  });
});
