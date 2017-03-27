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

  it('is an object whose keys are all possible roles', () => {
    expect(Object.keys(roles)).toMatchArray(allRoles);
  });

  it('has the correct roles marked as abstract', () => {
    expect(Object.keys(roles).filter(name => roles[name].abstract))
      .toMatchArray(abstractRoles);
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
});
