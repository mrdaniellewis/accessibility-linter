describe('#roles', () => {
  let roles;
  beforeEach(() => {
    roles = new AccessibilityLinter.Config().roles;
  });

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

  const nameFromContentRoles = [
    'button',
    'cell',
    'checkbox',
    'columnheader',
    'gridcell',
    'heading',
    'link',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'radio',
    'row',
    'rowgroup',
    'rowheader',
    'switch',
    'tab',
    'tooltip',
    'tree',
    'treeitem',
  ];

  it('is an object whose keys are all possible roles', () => {
    expect(Object.keys(roles)).toMatchArray(allRoles);
  });

  it('has the correct roles marked as abstract', () => {
    expect(Object.keys(roles).filter(name => roles[name].abstract))
      .toMatchArray(abstractRoles);
  });

  it('has the correct roles marked as name from content', () => {
    expect(Object.keys(roles).filter(name => roles[name].nameFromContent))
      .toMatchArray(nameFromContentRoles);
  });

  describe('has the correct subclass roles for', () => {
    Object.keys(new AccessibilityLinter.Config().roles).forEach((name) => {
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

  describe('has the correct allowed attributes for', () => {
    it('alert', () => {
      expect(roles.alert).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('alertdialog', () => {
      expect(roles.alertdialog).toInclude({
        allowed: ['expanded', 'modal'],
        required: undefined,
      });
    });

    it('application', () => {
      expect(roles.application).toInclude({
        allowed: ['activedescendant'],
        required: undefined,
      });
    });

    it('article', () => {
      expect(roles.article).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('banner', () => {
      expect(roles.banner).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('button', () => {
      expect(roles.button).toInclude({
        allowed: ['expanded', 'pressed'],
        required: undefined,
      });
    });

    it('cell', () => {
      expect(roles.cell).toInclude({
        allowed: ['colindex', 'colspan', 'expanded', 'rowindex', 'rowspan'],
        required: undefined,
      });
    });

    it('checkbox', () => {
      expect(roles.checkbox).toInclude({
        allowed: ['readonly'],
        required: ['checked'],
      });
    });

    it('columnheader', () => {
      expect(roles.columnheader).toInclude({
        allowed: ['colindex', 'colspan', 'expanded', 'readonly', 'required', 'rowindex', 'rowspan', 'selected', 'sort'],
        required: undefined,
      });
    });

    it('combobox', () => {
      expect(roles.combobox).toInclude({
        allowed: ['activedescendant', 'autocomplete', 'orientation', 'required'],
        required: ['controls', 'expanded'],
      });
    });

    it('command', () => {
      expect(roles.command).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('complementary', () => {
      expect(roles.complementary).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('composite', () => {
      expect(roles.composite).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('contentinfo', () => {
      expect(roles.contentinfo).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('definition', () => {
      expect(roles.definition).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('dialog', () => {
      expect(roles.dialog).toInclude({
        allowed: ['expanded', 'modal'],
        required: undefined,
      });
    });

    it('directory', () => {
      expect(roles.directory).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('document', () => {
      expect(roles.document).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('feed', () => {
      expect(roles.feed).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('figure', () => {
      expect(roles.figure).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('form', () => {
      expect(roles.form).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('grid', () => {
      expect(roles.grid).toInclude({
        allowed: ['activedescendant', 'colcount', 'expanded', 'level', 'multiselectable', 'readonly', 'rowcount'],
        required: undefined,
      });
    });

    it('gridcell', () => {
      expect(roles.gridcell).toInclude({
        allowed: ['colindex', 'colspan', 'expanded', 'readonly', 'required', 'rowindex', 'rowspan', 'selected'],
        required: undefined,
      });
    });

    it('group', () => {
      expect(roles.group).toInclude({
        allowed: ['activedescendant', 'expanded'],
        required: undefined,
      });
    });

    it('heading', () => {
      expect(roles.heading).toInclude({
        allowed: ['expanded', 'level'],
        required: undefined,
      });
    });

    it('img', () => {
      expect(roles.img).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('link', () => {
      expect(roles.link).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('list', () => {
      expect(roles.list).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('listbox', () => {
      expect(roles.listbox).toInclude({
        allowed: ['activedescendant', 'expanded', 'multiselectable', 'orientation', 'required'],
        required: undefined,
      });
    });

    it('listitem', () => {
      expect(roles.listitem).toInclude({
        allowed: ['expanded', 'level', 'posinset', 'setsize'],
        required: undefined,
      });
    });

    it('log', () => {
      expect(roles.log).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('main', () => {
      expect(roles.main).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('marquee', () => {
      expect(roles.marquee).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('math', () => {
      expect(roles.math).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('menu', () => {
      expect(roles.menu).toInclude({
        allowed: ['activedescendant', 'expanded', 'orientation'],
        required: undefined,
      });
    });

    it('menubar', () => {
      expect(roles.menubar).toInclude({
        allowed: ['activedescendant', 'expanded', 'orientation'],
        required: undefined,
      });
    });

    it('menuitem', () => {
      expect(roles.menuitem).toInclude({
        allowed: ['posinset', 'setsize'],
        required: undefined,
      });
    });

    it('menuitemcheckbox', () => {
      expect(roles.menuitemcheckbox).toInclude({
        allowed: undefined,
        required: ['checked'],
      });
    });

    it('menuitemradio', () => {
      expect(roles.menuitemradio).toInclude({
        allowed: ['posinset', 'selected', 'setsize'],
        required: ['checked'],
      });
    });

    it('navigation', () => {
      expect(roles.navigation).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('none', () => {
      expect(roles.none).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('note', () => {
      expect(roles.note).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('option', () => {
      expect(roles.option).toInclude({
        allowed: ['checked', 'posinset', 'selected', 'setsize'],
        required: undefined,
      });
    });

    it('presentation', () => {
      expect(roles.presentation).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('progressbar', () => {
      expect(roles.progressbar).toInclude({
        allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
        required: undefined,
      });
    });

    it('radio', () => {
      expect(roles.radio).toInclude({
        allowed: ['posinset', 'setsize'],
        required: ['checked'],
      });
    });

    it('radiogroup', () => {
      expect(roles.radiogroup).toInclude({
        allowed: ['activedescendant', 'expanded', 'required', 'orientation'],
        required: undefined,
      });
    });

    it('region', () => {
      expect(roles.region).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('row', () => {
      expect(roles.row).toInclude({
        allowed: ['activedescendant', 'colindex', 'expanded', 'level', 'rowindex', 'selected'],
        required: undefined,
      });
    });

    it('rowgroup', () => {
      expect(roles.rowgroup).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('rowheader', () => {
      expect(roles.rowheader).toInclude({
        allowed: ['colindex', 'colspan', 'expanded', 'rowindex', 'rowspan', 'readonly', 'required', 'selected', 'sort'],
        required: undefined,
      });
    });

    it('scrollbar', () => {
      expect(roles.scrollbar).toInclude({
        allowed: undefined,
        required: ['controls', 'orientation', 'valuemax', 'valuemin', 'valuenow'],
      });
    });

    it('search', () => {
      expect(roles.search).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('searchbox', () => {
      expect(roles.searchbox).toInclude({
        allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
        required: undefined,
      });
    });

    it('section', () => {
      expect(roles.section).toInclude({
        allowed: undefined,
        required: undefined,
      });
    });

    it('separator', () => {
      expect(roles.separator).toInclude({
        allowed: ['orientation', 'valuetext'],
        required: ['valuemax', 'valuemin', 'valuenow'],
      });
    });

    it('slider', () => {
      expect(roles.slider).toInclude({
        allowed: ['orientation', 'readonly', 'valuetext'],
        required: ['valuemax', 'valuemin', 'valuenow'],
      });
    });

    it('spinbutton', () => {
      expect(roles.spinbutton).toInclude({
        allowed: ['required', 'readonly', 'valuetext'],
        required: ['valuemax', 'valuemin', 'valuenow'],
      });
    });

    it('status', () => {
      expect(roles.status).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('switch', () => {
      expect(roles.switch).toInclude({
        allowed: undefined,
        required: ['checked'],
      });
    });

    it('tab', () => {
      expect(roles.tab).toInclude({
        allowed: ['expanded', 'posinset', 'selected', 'setsize'],
        required: undefined,
      });
    });

    it('table', () => {
      expect(roles.table).toInclude({
        allowed: ['colcount', 'expanded', 'rowcount'],
        required: undefined,
      });
    });

    it('tablist', () => {
      expect(roles.tablist).toInclude({
        allowed: ['activedescendant', 'level', 'multiselectable', 'orientation'],
        required: undefined,
      });
    });

    it('tabpanel', () => {
      expect(roles.tabpanel).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('term', () => {
      expect(roles.term).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('textbox', () => {
      expect(roles.textbox).toInclude({
        allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
        required: undefined,
      });
    });

    it('timer', () => {
      expect(roles.timer).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('toolbar', () => {
      expect(roles.toolbar).toInclude({
        allowed: ['activedescendant', 'expanded', 'orientation'],
        required: undefined,
      });
    });

    it('tooltip', () => {
      expect(roles.tooltip).toInclude({
        allowed: ['expanded'],
        required: undefined,
      });
    });

    it('tree', () => {
      expect(roles.tree).toInclude({
        allowed: ['activedescendant', 'expanded', 'multiselectable', 'orientation', 'required'],
        required: undefined,
      });
    });

    it('treegrid', () => {
      expect(roles.treegrid).toInclude({
        allowed: ['activedescendant', 'colcount', 'expanded', 'level', 'multiselectable', 'orientation', 'readonly', 'required', 'rowcount'],
        required: undefined,
      });
    });

    it('treeitem', () => {
      expect(roles.treeitem).toInclude({
        allowed: ['expanded', 'checked', 'level', 'posinset', 'selected', 'setsize'],
        required: undefined,
      });
    });
  });
});
