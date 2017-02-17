describe('config', () => {
  const obsolete = [
    'applet',
    'acronym',
    'bgsound',
    'command',
    'dir',
    'frame',
    'frameset',
    'hgroup',
    'image',
    'noframes',
    'isindex',
    'keygen',
    'listing',
    'nextid',
    'noembed',
    'plaintext',
    'strike',
    'xmp',
    'basefont',
    'big',
    'blink',
    'center',
    'font',
    'marquee',
    'multicol',
    'nobr',
    'spacer',
    'tt',
  ].sort();

  const allElements = [
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'datalist',
    'dd',
    'del',
    'details',
    'dfn',
    'dialog',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'math',
    'menu',
    'menuitem',
    'meta',
    'meter',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'param',
    'picture',
    'pre',
    'progress',
    'q',
    'rb',
    'rp',
    'rt',
    'rtc',
    'ruby',
    's',
    'samp',
    'script',
    'section',
    'select',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'svg',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'track',
    'u',
    'ul',
    'var',
    'video',
    'wbr',
  ];

  const config = AccessibilityLinter.config;

  it('is a property of AccessibilityLinter', () => {
    expect(config).toExist();
  });

  describe('#allowedAria', () => {
    const allowedAria = config.allowedAria;

    it('has a property for each non-obsolete element', () => {
      const elements = allElements.filter(name => !obsolete.includes(name));
      expect(Object.keys(allowedAria).filter(name => name !== '_default')).toMatchArray(elements);
    });
  });

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

    const ariaAttributes = config.ariaAttributes;

    it('is an object whose keys are all possible attributes', () => {
      expect(Object.keys(ariaAttributes)).toMatchArray(allAttributes);
    });

    it('has the correct roles marked as deprecated', () => {
      expect(Object.keys(ariaAttributes).filter(name => ariaAttributes[name].deprecated))
        .toMatchArray(deprecatedAttributes);
    });

    it('has the correct roles marked as global', () => {
      expect(Object.keys(ariaAttributes).filter(name => ariaAttributes[name].global))
        .toMatchArray(globalAttributes);
    });

    describe('allowed values', () => {
      ['atomic', 'busy', 'disabled', 'modal', 'multiline', 'multiselectable', 'readonly', 'required'].forEach((name) => {
        it(`allows true/false for ${name}`, () => {
          expect(ariaAttributes[name].values).toEqual({ type: 'true/false', tokens: ['true', 'false'] });
        });
      });

      ['checked', 'pressed'].forEach((name) => {
        it(`allows true/false/mixed/undefined for ${name}`, () => {
          expect(ariaAttributes[name].values).toEqual({ type: 'tristate', tokens: ['true', 'false', 'mixed', 'undefined'] });
        });
      });

      ['expanded', 'grabbed', 'hidden', 'selected'].forEach((name) => {
        it(`allows true/false/undefined for ${name}`, () => {
          expect(ariaAttributes[name].values).toEqual({ type: 'true/false/undefined', tokens: ['true', 'false', 'undefined'] });
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

  describe('#elements', () => {
    let elements;

    beforeEach(() => {
      elements = config.elements;
    });

    it('is a property of config', () => {
      expect(elements).toExist();
    });

    it('contains all elements', () => {
      expect(Object.keys(elements).sort()).toMatchArray(allElements.concat(obsolete).sort());
    });

    it('contains all obsolete elements', () => {
      expect(Object.keys(elements).filter(name => elements[name].obsolete).sort())
        .toMatchArray(obsolete);
    });

    describe('native text alternatives', () => {
      const hasNativeLabel = ['area', 'button', 'img', 'input', 'meter', 'output', 'progress', 'select', 'textarea'];
      const hasNativeDescription = [];

      describe('elements have no native label', () => {
        allElements.filter(name => !hasNativeLabel.includes(name)).forEach((name) => {
          it(`<${name}>`, () => {
            expect(elements[name].nativeLabel).toEqual(undefined);
          });
        });
      });

      describe('elements have no native description', () => {
        allElements.filter(name => !hasNativeDescription.includes(name)).forEach((name) => {
          it(`<${name}>`, () => {
            expect(elements[name].nativeDescription).toEqual(undefined);
          });
        });
      });

      describe('elements with a native label', () => {
        let utils;
        clean();

        beforeEach(() => {
          utils = new AccessibilityLinter.Utils();
        });

        ['img', 'area'].forEach((name) => {
          describe(`<${name}>`, () => {
            it('uses the alt attribute as text alternative', () => {
              const el = appendToBody(`<${name} alt="foo" />`);
              expect(elements[name].nativeLabel(el, utils)).toEqual('foo');
            });

            it('it defaults to an empty string', () => {
              const el = appendToBody(`<${name} />`);
              expect(elements[name].nativeLabel(el, utils)).toEqual('');
            });
          });
        });

        const testLabels = (name, attrs = '') => {
          it('uses label elements associated with the control by the "for" attribute', () => {
            const id = uniqueId();
            const label1 = appendToBody(`<label for="${id}">foo</label>`);
            const label2 = appendToBody(`<label for="${id}">foo</label>`);
            const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
            expect(elements[name].nativeLabel(el, utils)).toEqual([label1, label2]);
          });

          it('uses an ancestor label without the "for" attribute', () => {
            const label = appendToBody(`<label><${name} ${attrs}></${name}>foo</label>`);
            expect(elements[name].nativeLabel(label.querySelector(name), utils)).toEqual([label]);
          });

          it('does not use an ancestor label with the "for" attribute', () => {
            const id = uniqueId();
            const label = appendToBody(`<label for="${id}"><${name} ${attrs}></${name}>foo</label>`);
            expect(elements[name].nativeLabel(label.querySelector(name), utils)).toEqual([]);
          });

          it('uses for associated labels and ancestor labels', () => {
            const id = uniqueId();
            const label1 = appendToBody(`<label for="${id}">foo</label>`);
            const label2 = appendToBody(`<label for="${id}">foo</label>`);
            const label3 = appendToBody(`<label><${name} id="${id}" ${attrs}></${name}>fee</label>`);
            expect(elements[name].nativeLabel(label3.querySelector(name), utils))
              .toEqual([label1, label2, label3]);
          });

          it('associates labels with the first control with the id', () => {
            const id = uniqueId();
            appendToBody(`<label for="${id}">foo</label>`);
            appendToBody(`<${name} id="${id}"></${name}>`);
            const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
            expect(elements[name].nativeLabel(el, utils)).toEqual([]);
          });

          it('does not use hidden labels', () => {
            const id = uniqueId();
            appendToBody(`<label for="${id}" aria-hidden="true">foo</label>`);
            const el = appendToBody(`<${name} id="${id}"></${name}>`);
            expect(elements[name].nativeLabel(el, utils)).toEqual([]);
          });
        };

        ['button', 'meter', 'output', 'progress', 'select', 'textarea'].forEach((name) => {
          describe(`<${name}>`, () => {
            testLabels(name);
          });
        });

        describe('<input[type=hidden]>', () => {
          it('has no nativeLabel', () => {
            const label = appendToBody('<label><input type="hidden" alt="xx">foo</label>');
            expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual(null);
          });
        });

        describe('<input[type=image]>', () => {
          it('uses the alt text as a native label', () => {
            const label = appendToBody('<label><input type="image" alt="bar">foo</label>');
            expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual('bar');
          });

          it('uses the value text as a native label if there is no alt', () => {
            const label = appendToBody('<label><input type="image" value="bar">foo</label>');
            expect(elements.input.nativeLabel(label.querySelector('input'), utils)).toEqual('bar');
          });
        });

        describe('<input> with no type', () => {
          testLabels('input', 'alt="xxx"');
        });

        describe('<input> with a type', () => {
          // No need to test every type
          testLabels('input', 'type="email" alt="xxx"');
        });
      });
    });
  });

  describe('#roles', () => {
    const roles = config.roles;

    it('is a property of config', () => {
      expect(roles).toExist();
    });

    const roleHierarchy = {
      alert: ['section'],
      alertdialog: ['alert', 'dialog'],
      application: ['structure'],
      article: ['document'],
      banner: ['landmark'],
      button: ['command'],
      cell: ['section'],
      checkbox: ['input'],
      columnheader: ['cell', 'gridcell', 'sectionhead'],
      combobox: ['select'],
      command: ['widget'],
      complementary: ['landmark'],
      composite: ['widget'],
      contentinfo: ['landmark'],
      definition: ['section'],
      dialog: ['window'],
      directory: ['list'],
      document: ['structure'],
      feed: ['list'],
      figure: ['section'],
      form: ['landmark'],
      grid: ['composite', 'table'],
      gridcell: ['cell', 'widget'],
      group: ['section'],
      heading: ['sectionhead'],
      img: ['section'],
      input: ['widget'],
      landmark: ['section'],
      link: ['command'],
      list: ['section'],
      listbox: ['select'],
      listitem: ['section'],
      log: ['section'],
      main: ['landmark'],
      marquee: ['section'],
      math: ['section'],
      menu: ['select'],
      menubar: ['menu'],
      menuitem: ['command'],
      menuitemcheckbox: ['checkbox', 'menuitem'],
      menuitemradio: ['menuitemcheckbox', 'radio'],
      navigation: ['landmark'],
      none: ['structure'],
      note: ['section'],
      option: ['input'],
      presentation: ['structure'],
      progressbar: ['range'],
      radio: ['input'],
      radiogroup: ['select'],
      range: ['widget'],
      region: ['landmark'],
      roletype: [],
      row: ['group', 'widget'],
      rowgroup: ['structure'],
      rowheader: ['cell', 'gridcell', 'sectionhead'],
      scrollbar: ['range'],
      search: ['landmark'],
      searchbox: ['textbox'],
      section: ['structure'],
      sectionhead: ['structure'],
      select: ['composite', 'group'],
      separator: ['structure', 'widget'],
      slider: ['input', 'range'],
      spinbutton: ['composite', 'input', 'range'],
      status: ['section'],
      structure: ['roletype'],
      switch: ['checkbox'],
      tab: ['sectionhead', 'widget'],
      table: ['section'],
      tablist: ['composite'],
      tabpanel: ['section'],
      term: ['section'],
      textbox: ['input'],
      timer: ['status'],
      toolbar: ['group'],
      tooltip: ['section'],
      tree: ['select'],
      treegrid: ['grid', 'tree'],
      treeitem: ['listitem', 'option'],
      widget: ['roletype'],
      window: ['roletype'],
    };

    const allRoles = Object.keys(roleHierarchy);

    const abstractRoles = [
      'command',
      'composite',
      'input',
      'landmark',
      'range',
      'roletype',
      'section',
      'sectionhead',
      'select',
      'structure',
      'widget',
      'window',
    ];

    it('is an object whose keys are all possible roles', () => {
      expect(Object.keys(roles)).toMatchArray(allRoles);
    });

    it('has the correct roles marked as abstract', () => {
      expect(Object.keys(roles).filter(name => roles[name].abstract))
        .toMatchArray(abstractRoles);
    });

    describe('has the correct subclass roles for', () => {
      Object.keys(roles).forEach((name) => {
        it(name, () => {
          const subclasses = roles[name].subclass || [];
          Object.keys(roleHierarchy).forEach((roleName) => {
            if (subclasses.includes(roleName)) {
              expect(roleHierarchy[roleName]).toInclude(name, `expected ${roleName} to be superclass for ${name}`);
            } else {
              expect(roleHierarchy[roleName]).toNotInclude(name, `expected ${roleName} not to be superclass for ${name}`);
            }
          });
        });
      });
    });
  });
});
