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
        clean();

        ['img', 'area'].forEach((name) => {
          describe(`<${name}>`, () => {
            it('uses the alt attribute as text alternative', () => {
              const el = appendToBody(`<${name} alt="foo" />`);
              expect(elements[name].nativeLabel(el)).toEqual('foo');
            });

            it('it defaults to an empty string', () => {
              const el = appendToBody(`<${name} />`);
              expect(elements[name].nativeLabel(el)).toEqual('');
            });
          });
        });

        const testLabels = (name, attrs = '') => {
          it('uses label elements associated with the control by the "for" attribute', () => {
            const id = uniqueId();
            const label1 = appendToBody(`<label for="${id}">foo</label>`);
            const label2 = appendToBody(`<label for="${id}">foo</label>`);
            const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
            expect(elements[name].nativeLabel(el)).toEqual([label1, label2]);
          });

          it('uses an ancestor label without the "for" attribute', () => {
            const label = appendToBody(`<label><${name} ${attrs}></${name}>foo</label>`);
            expect(elements[name].nativeLabel(label.querySelector(name))).toEqual([label]);
          });

          it('does not use an ancestor label with the "for" attribute', () => {
            const id = uniqueId();
            const label = appendToBody(`<label for="${id}"><${name} ${attrs}></${name}>foo</label>`);
            expect(elements[name].nativeLabel(label.querySelector(name))).toEqual([]);
          });

          it('uses for associated labels and ancestor labels', () => {
            const id = uniqueId();
            const label1 = appendToBody(`<label for="${id}">foo</label>`);
            const label2 = appendToBody(`<label for="${id}">foo</label>`);
            const label3 = appendToBody(`<label><${name} id="${id}" ${attrs}></${name}>fee</label>`);
            expect(elements[name].nativeLabel(label3.querySelector(name)))
              .toEqual([label1, label2, label3]);
          });

          it('associates labels with the first control with the id', () => {
            const id = uniqueId();
            appendToBody(`<label for="${id}">foo</label>`);
            appendToBody(`<${name} id="${id}"></${name}>`);
            const el = appendToBody(`<${name} id="${id}" ${attrs}></${name}>`);
            expect(elements[name].nativeLabel(el)).toEqual([]);
          });

          it('does not use hidden labels', () => {
            const id = uniqueId();
            appendToBody(`<label for="${id}" aria-hidden="true">foo</label>`);
            const el = appendToBody(`<${name} id="${id}"></${name}>`);
            expect(elements[name].nativeLabel(el)).toEqual([]);
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
            expect(elements.input.nativeLabel(label.querySelector('input'))).toEqual(null);
          });
        });

        describe('<input[type=image]>', () => {
          it('uses the alt text as a native label', () => {
            const label = appendToBody('<label><input type="image" alt="bar">foo</label>');
            expect(elements.input.nativeLabel(label.querySelector('input'))).toEqual('bar');
          });

          it('uses the value text as a native label if there is no alt', () => {
            const label = appendToBody('<label><input type="image" value="bar">foo</label>');
            expect(elements.input.nativeLabel(label.querySelector('input'))).toEqual('bar');
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
