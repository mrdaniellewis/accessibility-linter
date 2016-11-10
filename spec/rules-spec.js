describe('rules', () => {
  const allRoles = [
    'alert',
    'alertdialog',
    'application',
    'article',
    'banner',
    'button',
    'cell',
    'checkbox',
    'columnheader',
    'combobox',
    'complementary',
    'contentinfo',
    'definition',
    'dialog',
    'directory',
    'document',
    'feed',
    'figure',
    'form',
    'grid',
    'gridcell',
    'group',
    'heading',
    'img',
    'link',
    'list',
    'listbox',
    'listitem',
    'log',
    'main',
    'marquee',
    'math',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'navigation',
    'note',
    'option',
    'presentation',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'row',
    'rowgroup',
    'rowheader',
    'scrollbar',
    'search',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'status',
    'switch',
    'tab',
    'table',
    'tablist',
    'tabpanel',
    'term',
    'textbox',
    'timer',
    'toolbar',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem',
  ];

  it('is a property of AccessibilityLinter', () => {
    expect(AccessibilityLinter.rules).toExist();
  });

  describe('#allRoles', () => {
    it('is a list of all possible roles', () => {
      expect(AccessibilityLinter.rules.roles).toEqualArray(allRoles);
    });
  });

  describe('#match has the expected return for', () => {
    const match = el => AccessibilityLinter.rules.match(el);
    let cleaner;

    before(() => {
      cleaner = domCleaner();
    });

    afterEach(() => {
      cleaner.clean();
    });

    after(() => {
      cleaner.stop();
    });

    it('an unknown element', () => {
      const el = build('<frank/>');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('a element with a href', () => {
      const el = build('<a href="#" />');
      expect(match(el)).toEqual({
        implicitRoles: ['link'],
        allowedRoles: [
          'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
          'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
        ],
      });
    });

    it('a element without a href', () => {
      const el = build('<a />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('address', () => {
      const el = build('<address />');
      expect(match(el)).toEqual({
        implicitRoles: ['contentinfo'],
        allowedRoles: [],
      });
    });

    it('area element with a href', () => {
      const el = build('<area href="#" />');
      expect(match(el)).toEqual({
        implicitRoles: ['link'],
        allowedRoles: [],
      });
    });

    it('article', () => {
      const el = build('<article />');
      expect(match(el)).toEqual({
        implicitRoles: ['article'],
        allowedRoles: ['presentation', 'document', 'application', 'main', 'region'],
      });
    });

    it('aside', () => {
      const el = build('<aside />');
      expect(match(el)).toEqual({
        implicitRoles: ['complementary'],
        allowedRoles: ['note', 'region', 'search'],
      });
    });

    it('audio', () => {
      const el = build('<audio />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application'],
      });
    });

    it('base', () => {
      const el = build('<base />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('body', () => {
      const el = build('<body />');
      expect(match(el)).toEqual({
        implicitRoles: ['document'],
        allowedRoles: [],
      });
    });

    it('button', () => {
      const el = build('<button />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: ['checkbox', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
      });
    });

    it('button type="menu"', () => {
      const el = build('<button type="menu" />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
      });
    });

    it('caption', () => {
      const el = build('<caption />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('col', () => {
      const el = build('<col />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('colgroup', () => {
      const el = build('<colgroup />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('datalist', () => {
      const el = build('<datalist />');
      expect(match(el)).toEqual({
        implicitRoles: ['listbox'],
        allowedRoles: [],
      });
    });

    it('dd', () => {
      const el = build('<dd />');
      expect(match(el)).toEqual({
        implicitRoles: ['definition'],
        allowedRoles: [],
      });
    });

    it('details', () => {
      const el = build('<details />');
      expect(match(el)).toEqual({
        implicitRoles: ['group'],
        allowedRoles: [],
      });
    });

    it('dialog', () => {
      const el = build('<dialog />');
      expect(match(el)).toEqual({
        implicitRoles: ['dialog'],
        allowedRoles: ['alertdialog'],
      });
    });

    it('div', () => {
      const el = build('<div />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('dl', () => {
      const el = build('<dl />');
      expect(match(el)).toEqual({
        implicitRoles: ['list'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('dt', () => {
      const el = build('<dt />');
      expect(match(el)).toEqual({
        implicitRoles: ['listitem'],
        allowedRoles: [],
      });
    });

    it('embed', () => {
      const el = build('<embed />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'presentation', 'img'],
      });
    });

    it('fieldset', () => {
      const el = build('<fieldset />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('figure', () => {
      const el = build('<figure />');
      expect(match(el)).toEqual({
        implicitRoles: ['figure'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('footer descendant of article or section', () => {
      const el = $('<article><footer /></article>').find('footer')[0];
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('footer', () => {
      const el = build('<footer />');
      expect(match(el)).toEqual({
        implicitRoles: ['contentinfo'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('form', () => {
      const el = build('<form />');
      expect(match(el)).toEqual({
        implicitRoles: ['form'],
        allowedRoles: ['search', 'presentation'],
      });
    });

    it('p', () => {
      const el = build('<p />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('pre', () => {
      const el = build('<pre />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('blockquote', () => {
      const el = build('<blockquote />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('h1', () => {
      const el = build('<h1 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h2', () => {
      const el = build('<h2 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h3', () => {
      const el = build('<h3 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h4', () => {
      const el = build('<h4 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h5', () => {
      const el = build('<h5 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('h6', () => {
      const el = build('<h6 />');
      expect(match(el)).toEqual({
        implicitRoles: ['heading'],
        allowedRoles: ['tab', 'presentation'],
      });
    });

    it('head', () => {
      const el = build('<head />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('header descendant of article or section', () => {
      const el = $('<article><header /></article>').find('header')[0];
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('header', () => {
      const el = build('<header />');
      expect(match(el)).toEqual({
        implicitRoles: ['banner'],
        allowedRoles: ['group', 'presentation'],
      });
    });

    it('hr', () => {
      const el = build('<hr />');
      expect(match(el)).toEqual({
        implicitRoles: ['separator'],
        allowedRoles: ['presentation'],
      });
    });

    it('html', () => {
      const el = build('<html />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('iframe', () => {
      const el = build('<iframe />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('img with alt=""', () => {
      const el = build('<img alt="" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['presentation'],
      });
    });

    it('img', () => {
      const el = build('<img />');
      expect(match(el)).toEqual({
        implicitRoles: ['img'],
        allowedRoles: allRoles.filter(role => role !== 'img'),
      });
    });

    it('input type="button"', () => {
      const el = build('<input type="button" />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
      });
    });

    it('input type="checkbox"', () => {
      const el = build('<input type="checkbox" />');
      expect(match(el)).toEqual({
        implicitRoles: ['checkbox'],
        allowedRoles: ['button', 'menuitemcheckbox', 'switch'],
      });
    });

    it('input type="color"', () => {
      const el = build('<input type="color" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="date"', () => {
      const el = build('<input type="date" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="datetime"', () => {
      const el = build('<input type="datetime" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="datetime-local"', () => {
      const el = build('<input type="datetime-local" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="list" without list attribute', () => {
      const el = build('<input type="email" />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="file"', () => {
      const el = build('<input type="file" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="hidden"', () => {
      const el = build('<input type="hidden" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="image"', () => {
      const el = build('<input type="image" />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
      });
    });

    it('input type="month"', () => {
      const el = build('<input type="month" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="number"', () => {
      const el = build('<input type="number" />');
      expect(match(el)).toEqual({
        implicitRoles: ['spinbutton'],
        allowedRoles: [],
      });
    });

    it('input type="password"', () => {
      const el = build('<input type="password" />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="radio"', () => {
      const el = build('<input type="radio" />');
      expect(match(el)).toEqual({
        implicitRoles: ['radio'],
        allowedRoles: ['menuitemradio'],
      });
    });

    it('input type="range"', () => {
      const el = build('<input type="range" />');
      expect(match(el)).toEqual({
        implicitRoles: ['slider'],
        allowedRoles: [],
      });
    });

    it('input type="reset"', () => {
      const el = build('<input type="reset" />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('input type="search" with no list attribute', () => {
      const el = build('<input type="search" />');
      expect(match(el)).toEqual({
        implicitRoles: ['searchbox'],
        allowedRoles: [],
      });
    });

    it('input type="submit"', () => {
      const el = build('<input type="submit" />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('input type="tel" with no list attribute', () => {
      const el = build('<input type="tel" />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="text" with no list attribute', () => {
      const el = build('<input type="text" />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="text" with a list attribute', () => {
      const el = build('<input type="text" list="list" />');
      expect(match(el)).toEqual({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="search" with a list attribute', () => {
      const el = build('<input type="search" list="list" />');
      expect(match(el)).toEqual({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="tel" with a list attribute', () => {
      const el = build('<input type="tel" list="list" />');
      expect(match(el)).toEqual({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="url" with a list attribute', () => {
      const el = build('<input type="url" list="list" />');
      expect(match(el)).toEqual({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="email" with a list attribute', () => {
      const el = build('<input type="email" list="list" />');
      expect(match(el)).toEqual({
        implicitRoles: ['combobox'],
        allowedRoles: [],
      });
    });

    it('input type="time"', () => {
      const el = build('<input type="time" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('input type="url" with no list attribute', () => {
      const el = build('<input type="url" />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('input type="week"', () => {
      const el = build('<input type="week" />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('ins', () => {
      const el = build('<ins />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('del', () => {
      const el = build('<del />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('keygen', () => {
      const el = build('<keygen />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('label', () => {
      const el = build('<label />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('legend', () => {
      const el = build('<legend />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('li whose parent is an ol', () => {
      const el = $('<ol><li /></ol>').find('li')[0];
      expect(match(el)).toEqual({
        implicitRoles: ['listitem'],
        allowedRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
      });
    });

    it('li whose parent is a ul', () => {
      const el = $('<ul><li /></ul>').find('li')[0];
      expect(match(el)).toEqual({
        implicitRoles: ['listitem'],
        allowedRoles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
      });
    });

    it('link with a href', () => {
      const el = build('<link href="#" />');
      expect(match(el)).toEqual({
        implicitRoles: ['link'],
        allowedRoles: [],
      });
    });

    it('main', () => {
      const el = build('<main />');
      expect(match(el)).toEqual({
        implicitRoles: ['main'],
        allowedRoles: [],
      });
    });

    it('map', () => {
      const el = build('<map />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('math', () => {
      const el = build('<math />');
      expect(match(el)).toEqual({
        implicitRoles: ['math'],
        allowedRoles: [],
      });
    });

    it('menu type="toolbar"', () => {
      const el = build('<menu type="toolbar" />');
      expect(match(el)).toEqual({
        implicitRoles: ['toolbar'],
        allowedRoles: [],
      });
    });

    it('menuitem type="command"', () => {
      const el = build('<menuitem type="command" />');
      expect(match(el)).toEqual({
        implicitRoles: ['menuitem'],
        allowedRoles: [],
      });
    });

    it('menuitem type="checkbox"', () => {
      const el = build('<menuitem type="checkbox" />');
      expect(match(el)).toEqual({
        implicitRoles: ['menuitemcheckbox'],
        allowedRoles: [],
      });
    });

    it('menuitem type="radio"', () => {
      const el = build('<menuitem type="radio" />');
      expect(match(el)).toEqual({
        implicitRoles: ['menuitemradio'],
        allowedRoles: [],
      });
    });

    it('meta', () => {
      const el = build('<meta />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('meter', () => {
      const el = build('<meter />');
      expect(match(el)).toEqual({
        implicitRoles: ['progressbar'],
        allowedRoles: [],
      });
    });

    it('nav', () => {
      const el = build('<nav />');
      expect(match(el)).toEqual({
        implicitRoles: ['navigation'],
        allowedRoles: [],
      });
    });

    it('noscript', () => {
      const el = build('<noscript />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('object', () => {
      const el = build('<object />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('ol', () => {
      const el = build('<ol />');
      expect(match(el)).toEqual({
        implicitRoles: ['list'],
        allowedRoles: ['directory', 'group', 'listbox', 'menu', 'menubar', 'presentation', 'radiogroup', 'tablist', 'toolbar', 'tree'],
      });
    });

    it('optgroup', () => {
      const el = build('<optgroup />');
      expect(match(el)).toEqual({
        implicitRoles: ['group'],
        allowedRoles: [],
      });
    });

    it('option within a list of options', () => {
      const el = $('<select><option /></select>').find('option')[0];
      expect(match(el)).toEqual({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option within a list of options in an optgroup', () => {
      const el = $('<select><optgroup><option /></optgroup></select>').find('option')[0];
      expect(match(el)).toEqual({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option within a datalist', () => {
      const el = $('<datalist><option /></datalist>').find('option')[0];
      expect(match(el)).toEqual({
        implicitRoles: ['option'],
        allowedRoles: [],
      });
    });

    it('option on its own', () => {
      const el = build('<option />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('output', () => {
      const el = build('<output />');
      expect(match(el)).toEqual({
        implicitRoles: ['status'],
        allowedRoles: allRoles.filter(role => role !== 'status'),
      });
    });

    it('param', () => {
      const el = build('<param />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('picture', () => {
      const el = build('<picture />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('progress', () => {
      const el = build('<progress />');
      expect(match(el)).toEqual({
        implicitRoles: ['progressbar'],
        allowedRoles: [],
      });
    });

    it('script', () => {
      const el = build('<script />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('section', () => {
      const el = build('<section />');
      expect(match(el)).toEqual({
        implicitRoles: ['region'],
        allowedRoles: [
          'alert', 'alertdialog', 'application', 'banner', 'complementary', 'contentinfo',
          'dialog', 'document', 'log', 'main', 'marquee', 'navigation', 'search', 'status',
        ],
      });
    });

    it('select', () => {
      const el = build('<select />');
      expect(match(el)).toEqual({
        implicitRoles: ['listbox'],
        allowedRoles: [],
      });
    });

    it('source', () => {
      const el = build('<source />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('span', () => {
      const el = build('<span />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: allRoles,
      });
    });

    it('style', () => {
      const el = build('<style />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('svg', () => {
      const el = build('<svg />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application', 'document', 'img'],
      });
    });

    it('summary', () => {
      const el = build('<summary />');
      expect(match(el)).toEqual({
        implicitRoles: ['button'],
        allowedRoles: [],
      });
    });

    it('table', () => {
      const el = build('<table />');
      expect(match(el)).toEqual({
        implicitRoles: ['table'],
        allowedRoles: allRoles.filter(role => role !== 'table'),
      });
    });

    it('template', () => {
      const el = build('<template />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('textarea', () => {
      const el = build('<textarea />');
      expect(match(el)).toEqual({
        implicitRoles: ['textbox'],
        allowedRoles: [],
      });
    });

    it('tbody', () => {
      const el = build('<tbody />');
      expect(match(el)).toEqual({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('thead', () => {
      const el = build('<thead />');
      expect(match(el)).toEqual({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('tfoot', () => {
      const el = build('<tfoot />');
      expect(match(el)).toEqual({
        implicitRoles: ['rowgroup'],
        allowedRoles: allRoles.filter(role => role !== 'rowgroup'),
      });
    });

    it('title', () => {
      const el = build('<title />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('td', () => {
      const el = build('<td />');
      expect(match(el)).toEqual({
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
        expect(match(el)).toEqual({
          implicitRoles: [],
          allowedRoles: allRoles,
        });
      });
    });

    it('th', () => {
      const el = build('<th />');
      expect(match(el)).toEqual({
        implicitRoles: ['columnheader', 'rowheader'],
        allowedRoles: allRoles.filter(role => !['columnheader', 'rowheader'].includes(role)),
      });
    });

    it('tr', () => {
      const el = build('<tr />');
      expect(match(el)).toEqual({
        implicitRoles: ['row'],
        allowedRoles: allRoles.filter(role => role !== 'row'),
      });
    });

    it('track', () => {
      const el = build('<track />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: [],
      });
    });

    it('ul', () => {
      const el = build('<ul />');
      expect(match(el)).toEqual({
        implicitRoles: ['list'],
        allowedRoles: [
          'directory', 'group', 'listbox', 'menu', 'menubar', 'tablist',
          'toolbar', 'tree', 'presentation',
        ],
      });
    });

    it('video', () => {
      const el = build('<video />');
      expect(match(el)).toEqual({
        implicitRoles: [],
        allowedRoles: ['application'],
      });
    });
  });
});
