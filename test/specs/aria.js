describe('aria', () => {
  const aria = AccessibilityLinter.aria;

  it('is a property of AccessibilityLinter', () => {
    expect(aria).toExist();
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

  describe('#roles', () => {
    it('is an object whose keys are all possible roles', () => {
      expect(Object.keys(aria.roles)).toEqualArray(allRoles);
    });

    it('has the correct roles marked as abstract', () => {
      expect(Object.keys(aria.roles).filter(name => aria.roles[name].abstract))
        .toEqualArray(abstractRoles);
    });

    describe('has the correct subclass roles for', () => {
      Object.keys(aria.roles).forEach((name) => {
        it(name, () => {
          const subclasses = aria.roles[name].subclass || [];
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

  describe('#getRole', () => {
    clean();

    it('returns null for no role', () => {
      const el = build('<div />');
      expect(aria.getRole(el)).toEqual(null);
    });

    it('returns a valid provided role', () => {
      const el = build('<div role="alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });

    it('returns the first valid provided role', () => {
      const el = build('<div role="invalid alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });

    it('returns an implicit role', () => {
      const el = build('<input />');
      expect(aria.getRole(el)).toEqual('textbox');
    });

    it('returns an implicit role if no valid role is provided', () => {
      const el = build('<input role="invalid" />');
      expect(aria.getRole(el)).toEqual('textbox');
    });

    it('does not return abstract roles', () => {
      const el = build('<input role="widget alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });
  });

  describe('#hasRole', () => {
    it('returns false for an element with no role', () => {
      const el = build('<div />');
      expect(aria.hasRole(el, 'none')).toEqual(false);
    });

    it('returns true for an element with an explicit role', () => {
      const el = build('<div role="button" />');
      expect(aria.hasRole(el, 'button')).toEqual(true);
    });

    it('returns true for an element with an implicit role', () => {
      const el = build('<button />');
      expect(aria.hasRole(el, 'button')).toEqual(true);
    });

    it('returns true for a parent superclass role', () => {
      const el = build('<button />');
      expect(aria.hasRole(el, 'command')).toEqual(true);
    });

    it('returns true for a ancestor superclass role', () => {
      const el = build('<button />');
      expect(aria.hasRole(el, 'roletype')).toEqual(true);
    });

    it('returns false for an invalid string role', () => {
      expect(aria.hasRole('xxx', 'button')).toEqual(false);
    });

    it('returns false for an non-matching string role', () => {
      expect(aria.hasRole('alert', 'button')).toEqual(false);
    });

    it('returns true for a matching string role', () => {
      expect(aria.hasRole('button', 'button')).toEqual(true);
    });

    it('returns true for an matching ancestor string role', () => {
      expect(aria.hasRole('button', 'roletype')).toEqual(true);
    });
  });

  describe('#getElementRules has the expected return for', () => {
    const getElementRules = el => aria.getElementRules(el);
    let cleaner;

    before(() => {
      cleaner = domCleaner({ exclude: '#mocha *' });
    });

    afterEach(() => {
      cleaner.clean();
    });

    after(() => {
      cleaner.stop();
    });

    it('an unknown element', () => {
      const el = build('<frank />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('a element with a href', () => {
      const el = build('<a href="#" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['link'],
        allowedRoles: [
          'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
          'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
        ],
      });
    });

    it('a element without a href', () => {
      const el = build('<a />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('address', () => {
      const el = build('<address />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['contentinfo'],
        allowedRoles: [],
      });
    });

    it('area element with a href', () => {
      const el = build('<area href="#" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['link'],
        allowedRoles: [],
      });
    });

    it('article', () => {
      const el = build('<article />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['article'],
        allowedRoles: ['presentation', 'document', 'application', 'main', 'region'],
      });
    });

    it('aside', () => {
      const el = build('<aside />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['complementary'],
        allowedRoles: ['note', 'region', 'search'],
      });
    });

    it('audio', () => {
      const el = build('<audio />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application'],
      });
    });

    it('base', () => {
      const el = build('<base />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('body', () => {
      const el = build('<body />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['document'],
        allowedRoles: [],
      });
    });

    it('button', () => {
      const el = build('<button />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: ['checkbox', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
      });
    });

    it('button type="menu"', () => {
      const el = build('<button type="menu" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
      });
    });

    it('caption', () => {
      const el = build('<caption />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('col', () => {
      const el = build('<col />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('colgroup', () => {
      const el = build('<colgroup />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('datalist', () => {
      const el = build('<datalist />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['listbox'],
        allowedRoles: [],
      });
    });

    it('dd', () => {
      const el = build('<dd />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['definition'],
        allowedRoles: [],
      });
    });

    it('details', () => {
      const el = build('<details />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['group'],
        allowedRoles: [],
      });
    });

    it('dialog', () => {
      const el = build('<dialog />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['dialog'],
        allowedRoles: ['alertdialog'],
      });
    });

    it('div', () => {
      const el = build('<div />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('dl', () => {
      const el = build('<dl />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['list'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('dt', () => {
      const el = build('<dt />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['listitem'],
        allowedRoles: [],
      });
    });

    it('embed', () => {
      const el = build('<embed />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'presentation', 'img'],
      });
    });

    it('fieldset', () => {
      const el = build('<fieldset />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('figure', () => {
      const el = build('<figure />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['figure'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('footer descendant of article or section', () => {
      const el = $('<article><footer /></article>').find('footer')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('footer', () => {
      const el = build('<footer />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['contentinfo'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('form', () => {
      const el = build('<form />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['form'],
        allowedRoles: ['search', 'presentation'],
      });
    });

    it('p', () => {
      const el = build('<p />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('pre', () => {
      const el = build('<pre />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('blockquote', () => {
      const el = build('<blockquote />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('h1', () => {
      const el = build('<h1 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h2', () => {
      const el = build('<h2 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h3', () => {
      const el = build('<h3 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h4', () => {
      const el = build('<h4 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h5', () => {
      const el = build('<h5 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h6', () => {
      const el = build('<h6 />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('head', () => {
      const el = build('<head />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('header descendant of article or section', () => {
      const el = $('<article><header /></article>').find('header')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('header', () => {
      const el = build('<header />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['banner'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('hr', () => {
      const el = build('<hr />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['separator'],
        allowedRoles: ['presentation'],
      });
    });

    it('html', () => {
      const el = build('<html />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('iframe', () => {
      const el = build('<iframe />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('img with alt=""', () => {
      const el = build('<img alt="" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['presentation'],
      });
    });

    it('img', () => {
      const el = build('<img />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['img'],
        allowedRoles: allRoles.filter(role => role !== 'img'),
      });
    });

    it('input type="button"', () => {
      const el = build('<input type="button" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
      });
    });

    it('input type="checkbox"', () => {
      const el = build('<input type="checkbox" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['checkbox'],
        allowedRoles: ['button', 'menuitemcheckbox', 'switch'],
      });
    });

    it('input type="color"', () => {
      const el = build('<input type="color" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="date"', () => {
      const el = build('<input type="date" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="datetime"', () => {
      const el = build('<input type="datetime" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="datetime-local"', () => {
      const el = build('<input type="datetime-local" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="list" without list attribute', () => {
      const el = build('<input type="email" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="file"', () => {
      const el = build('<input type="file" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="hidden"', () => {
      const el = build('<input type="hidden" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="image"', () => {
      const el = build('<input type="image" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
      });
    });

    it('input type="month"', () => {
      const el = build('<input type="month" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="number"', () => {
      const el = build('<input type="number" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['spinbutton'],
        allowedRoles: [],
      });
    });

    it('input type="password"', () => {
      const el = build('<input type="password" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="radio"', () => {
      const el = build('<input type="radio" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['radio'],
        allowedRoles: ['menuitemradio'],
      });
    });

    it('input type="range"', () => {
      const el = build('<input type="range" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['slider'],
        allowedRoles: [],
      });
    });

    it('input type="reset"', () => {
      const el = build('<input type="reset" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('input type="search" with no list attribute', () => {
      const el = build('<input type="search" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['searchbox'],
        allowedRoles: [],
      });
    });

    it('input type="submit"', () => {
      const el = build('<input type="submit" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('input type="tel" with no list attribute', () => {
      const el = build('<input type="tel" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="text" with no list attribute', () => {
      const el = build('<input type="text" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="text" with a list attribute', () => {
      const el = build('<input type="text" list="list" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="search" with a list attribute', () => {
      const el = build('<input type="search" list="list" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="tel" with a list attribute', () => {
      const el = build('<input type="tel" list="list" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="url" with a list attribute', () => {
      const el = build('<input type="url" list="list" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="email" with a list attribute', () => {
      const el = build('<input type="email" list="list" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="time"', () => {
      const el = build('<input type="time" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="url" with no list attribute', () => {
      const el = build('<input type="url" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="week"', () => {
      const el = build('<input type="week" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('ins', () => {
      const el = build('<ins />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('del', () => {
      const el = build('<del />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('keygen', () => {
      const el = build('<keygen />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('label', () => {
      const el = build('<label />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('legend', () => {
      const el = build('<legend />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('li whose parent is an ol', () => {
      const el = $('<ol><li /></ol>').find('li')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['listitem'],
        allowedRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
      });
    });

    it('li whose parent is a ul', () => {
      const el = $('<ul><li /></ul>').find('li')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['listitem'],
        allowedRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
      });
    });

    it('link with a href', () => {
      const el = build('<link href="#" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['link'],
        allowedRoles: [],
      });
    });

    it('main', () => {
      const el = build('<main />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['main'],
        allowedRoles: [],
      });
    });

    it('map', () => {
      const el = build('<map />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('math', () => {
      const el = build('<math />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['math'],
        allowedRoles: [],
      });
    });

    it('menu type="toolbar"', () => {
      const el = build('<menu type="toolbar" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['toolbar'],
        allowedRoles: [],
      });
    });

    it('menuitem type="command"', () => {
      const el = build('<menuitem type="command" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['menuitem'],
        allowedRoles: [],
      });
    });

    it('menuitem type="checkbox"', () => {
      const el = build('<menuitem type="checkbox" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['menuitemcheckbox'],
        allowedRoles: [],
      });
    });

    it('menuitem type="radio"', () => {
      const el = build('<menuitem type="radio" />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['menuitemradio'],
        allowedRoles: [],
      });
    });

    it('meta', () => {
      const el = build('<meta />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('meter', () => {
      const el = build('<meter />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['progressbar'],
        allowedRoles: [],
      });
    });

    it('nav', () => {
      const el = build('<nav />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['navigation'],
        allowedRoles: [],
      });
    });

    it('noscript', () => {
      const el = build('<noscript />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('object', () => {
      const el = build('<object />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('ol', () => {
      const el = build('<ol />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['list'],
        allowedRoles: ['directory', 'group', 'listbox', 'menu', 'menubar', 'presentation', 'radiogroup', 'tablist', 'toolbar', 'tree'],
      });
    });

    it('optgroup', () => {
      const el = build('<optgroup />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['group'],
        allowedRoles: [],
      });
    });

    it('option within a list of options', () => {
      const el = $('<select><option /></select>').find('option')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option within a list of options in an optgroup', () => {
      const el = $('<select><optgroup><option /></optgroup></select>').find('option')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option within a datalist', () => {
      const el = $('<datalist><option /></datalist>').find('option')[0];
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option on its own', () => {
      const el = build('<option />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('output', () => {
      const el = build('<output />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['status'],
        allowedRoles: allRoles.filter(role => role !== 'status'),
      });
    });

    it('param', () => {
      const el = build('<param />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('picture', () => {
      const el = build('<picture />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('progress', () => {
      const el = build('<progress />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['progressbar'],
        allowedRoles: [],
      });
    });

    it('script', () => {
      const el = build('<script />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('section', () => {
      const el = build('<section />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['region'],
        allowedRoles: [
          'alert', 'alertdialog', 'application', 'banner', 'complementary', 'contentinfo',
          'dialog', 'document', 'log', 'main', 'marquee', 'navigation', 'search', 'status',
        ],
      });
    });

    it('select', () => {
      const el = build('<select />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['listbox'],
        allowedRoles: [],
      });
    });

    it('source', () => {
      const el = build('<source />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('span', () => {
      const el = build('<span />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('style', () => {
      const el = build('<style />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('svg', () => {
      const el = build('<svg />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('summary', () => {
      const el = build('<summary />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('table', () => {
      const el = build('<table />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['table'],
        allowedRoles: allRoles.filter(role => role !== 'table'),
      });
    });

    it('template', () => {
      const el = build('<template />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('textarea', () => {
      const el = build('<textarea />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('tbody', () => {
      const el = build('<tbody />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('thead', () => {
      const el = build('<thead />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('tfoot', () => {
      const el = build('<tfoot />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('title', () => {
      const el = build('<title />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('td', () => {
      const el = build('<td />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['cell'],
        allowedRoles: allRoles.filter(role => role !== 'cell'),
      });
    });

    [
      'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'time',
      'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark',
      'ruby', 'rt', 'rp', 'bdi', 'bdo', 'br', 'wbr',
    ].forEach((name) => {
      it(name, () => {
        const el = build(`<${name} />`);
        expect(getElementRules(el)).toInclude({
          implicitRoles: [],
          allowedRoles: allRoles,
        });
      });
    });

    it('th', () => {
      const el = build('<th />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['columnheader', 'rowheader'],
        allowedRoles: allRoles.filter(role => !['columnheader', 'rowheader'].includes(role)),
      });
    });

    it('tr', () => {
      const el = build('<tr />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['row'],
        allowedRoles: allRoles.filter(role => role !== 'row'),
      });
    });

    it('track', () => {
      const el = build('<track />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('ul', () => {
      const el = build('<ul />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: ['list'],
        allowedRoles: [
          'directory', 'group', 'listbox', 'menu', 'menubar', 'tablist',
          'toolbar', 'tree', 'presentation',
        ],
      });
    });

    it('video', () => {
      const el = build('<video />');
      expect(getElementRules(el)).toInclude({
        implicitRoles: [],
        allowedRoles: ['application'],
      });
    });
  });
});
