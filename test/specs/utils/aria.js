describe('#aria', () => {
  let aria;
  clean();

  beforeAll(() => {
    aria = new AccessibilityLinter.Utils().aria;
  });

  it('is a property of utils', () => {
    expect(aria).toExist();
  });

  describe('#allowed', () => {
    describe('it has the expected return for', () => {
      it('an unknown element', () => {
        const el = build('<frank />');
        expect(aria.allowed(el)).toInclude({
          roles: '*',
          implicit: [],
        });
      });

      it('a element with a href', () => {
        const el = build('<a href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [
            'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
          ],
        });
      });

      it('a element without a href', () => {
        const el = build('<a />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('address', () => {
        const el = build('<address />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['contentinfo'],
          roles: [],
        });
      });

      it('area element with a href', () => {
        const el = build('<area href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [],
        });
      });

      it('article', () => {
        const el = build('<article />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['article'],
          roles: ['presentation', 'document', 'application', 'main', 'region'],
        });
      });

      it('aside', () => {
        const el = build('<aside />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['complementary'],
          roles: ['note', 'region', 'search'],
        });
      });

      it('audio', () => {
        const el = build('<audio />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application'],
        });
      });

      it('base', () => {
        const el = build('<base />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('body', () => {
        const el = build('<body />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['document'],
          roles: [],
        });
      });

      it('button', () => {
        const el = build('<button />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['checkbox', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
        });
      });

      it('button type="menu"', () => {
        const el = build('<button type="menu" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
        });
      });

      it('caption', () => {
        const el = build('<caption />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('col', () => {
        const el = build('<col />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('colgroup', () => {
        const el = build('<colgroup />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('data', () => {
        const el = build('<data />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('datalist', () => {
        const el = build('<datalist />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listbox'],
          roles: [],
        });
      });

      it('dd', () => {
        const el = build('<dd />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['definition'],
          roles: [],
        });
      });

      it('details', () => {
        const el = build('<details />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['group'],
          roles: [],
        });
      });

      it('dialog', () => {
        const el = build('<dialog />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['dialog'],
          roles: ['alertdialog'],
        });
      });

      it('div', () => {
        const el = build('<div />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('dl', () => {
        const el = build('<dl />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: ['group', 'presentation'],
        });
      });

      it('dt', () => {
        const el = build('<dt />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: [],
        });
      });

      it('embed', () => {
        const el = build('<embed />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'presentation', 'img'],
        });
      });

      it('fieldset', () => {
        const el = build('<fieldset />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('figcaption', () => {
        const el = build('<figcaption />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('figure', () => {
        const el = build('<figure />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['figure'],
          roles: ['group', 'presentation'],
        });
      });

      it('footer descendant of article or section', () => {
        const el = $('<article><footer /></article>').find('footer')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('footer', () => {
        const el = build('<footer />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['contentinfo'],
          roles: ['group', 'presentation'],
        });
      });

      it('form', () => {
        const el = build('<form />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['form'],
          roles: ['search', 'presentation'],
        });
      });

      it('p', () => {
        const el = build('<p />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('pre', () => {
        const el = build('<pre />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('blockquote', () => {
        const el = build('<blockquote />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('h1', () => {
        const el = build('<h1 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h2', () => {
        const el = build('<h2 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h3', () => {
        const el = build('<h3 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h4', () => {
        const el = build('<h4 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h5', () => {
        const el = build('<h5 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h6', () => {
        const el = build('<h6 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('head', () => {
        const el = build('<head />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('header descendant of article or section', () => {
        const el = $('<article><header /></article>').find('header')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('header', () => {
        const el = build('<header />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['banner'],
          roles: ['group', 'presentation'],
        });
      });

      it('hr', () => {
        const el = build('<hr />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['separator'],
          roles: ['presentation'],
        });
      });

      it('html', () => {
        const el = build('<html />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('iframe', () => {
        const el = build('<iframe />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('img with alt=""', () => {
        const el = build('<img alt="" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['presentation'],
        });
      });

      it('img', () => {
        const el = build('<img />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['img'],
          roles: '*',
        });
      });

      it('input type="button"', () => {
        const el = build('<input type="button" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
        });
      });

      it('input type="checkbox"', () => {
        const el = build('<input type="checkbox" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['checkbox'],
          roles: ['button', 'menuitemcheckbox', 'switch'],
        });
      });

      it('input type="color"', () => {
        const el = build('<input type="color" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="date"', () => {
        const el = build('<input type="date" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="datetime"', () => {
        const el = build('<input type="datetime" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="datetime-local"', () => {
        const el = build('<input type="datetime-local" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="list" without list attribute', () => {
        const el = build('<input type="email" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="file"', () => {
        const el = build('<input type="file" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="hidden"', () => {
        const el = build('<input type="hidden" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="image"', () => {
        const el = build('<input type="image" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
        });
      });

      it('input type="month"', () => {
        const el = build('<input type="month" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="number"', () => {
        const el = build('<input type="number" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['spinbutton'],
          roles: [],
        });
      });

      it('input type="password"', () => {
        const el = build('<input type="password" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="radio"', () => {
        const el = build('<input type="radio" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['radio'],
          roles: ['menuitemradio'],
        });
      });

      it('input type="range"', () => {
        const el = build('<input type="range" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['slider'],
          roles: [],
        });
      });

      it('input type="reset"', () => {
        const el = build('<input type="reset" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('input type="search" with no list attribute', () => {
        const el = build('<input type="search" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['searchbox'],
          roles: [],
        });
      });

      it('input type="submit"', () => {
        const el = build('<input type="submit" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('input type="tel" with no list attribute', () => {
        const el = build('<input type="tel" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="text" with no list attribute', () => {
        const el = build('<input type="text" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="text" with a list attribute', () => {
        const el = build('<input type="text" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="search" with a list attribute', () => {
        const el = build('<input type="search" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="tel" with a list attribute', () => {
        const el = build('<input type="tel" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="url" with a list attribute', () => {
        const el = build('<input type="url" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="email" with a list attribute', () => {
        const el = build('<input type="email" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="time"', () => {
        const el = build('<input type="time" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="url" with no list attribute', () => {
        const el = build('<input type="url" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="week"', () => {
        const el = build('<input type="week" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('ins', () => {
        const el = build('<ins />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('del', () => {
        const el = build('<del />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('label', () => {
        const el = build('<label />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('legend', () => {
        const el = build('<legend />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('li whose parent is an ol', () => {
        const el = $('<ol><li /></ol>').find('li')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
        });
      });

      it('li whose parent is a ul', () => {
        const el = $('<ul><li /></ul>').find('li')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
        });
      });

      it('link with a href', () => {
        const el = build('<link href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [],
        });
      });

      it('main', () => {
        const el = build('<main />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['main'],
          roles: [],
        });
      });

      it('map', () => {
        const el = build('<map />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('math', () => {
        const el = build('<math />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['math'],
          roles: [],
        });
      });

      it('menu type="toolbar"', () => {
        const el = build('<menu type="toolbar" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['toolbar'],
          roles: [],
        });
      });

      it('menuitem type="command"', () => {
        const el = build('<menuitem type="command" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitem'],
          roles: [],
        });
      });

      it('menuitem type="checkbox"', () => {
        const el = build('<menuitem type="checkbox" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitemcheckbox'],
          roles: [],
        });
      });

      it('menuitem type="radio"', () => {
        const el = build('<menuitem type="radio" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitemradio'],
          roles: [],
        });
      });

      it('meta', () => {
        const el = build('<meta />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('meter', () => {
        const el = build('<meter />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['progressbar'],
          roles: [],
        });
      });

      it('nav', () => {
        const el = build('<nav />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['navigation'],
          roles: [],
        });
      });

      it('noscript', () => {
        const el = build('<noscript />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('object', () => {
        const el = build('<object />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('ol', () => {
        const el = build('<ol />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: ['directory', 'group', 'listbox', 'menu', 'menubar', 'presentation', 'radiogroup', 'tablist', 'toolbar', 'tree'],
        });
      });

      it('optgroup', () => {
        const el = build('<optgroup />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['group'],
          roles: [],
        });
      });

      it('option within a list of options', () => {
        const el = $('<select><option /></select>').find('option')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option within a list of options in an optgroup', () => {
        const el = $('<select><optgroup><option /></optgroup></select>').find('option')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option within a datalist', () => {
        const el = $('<datalist><option /></datalist>').find('option')[0];
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option on its own', () => {
        const el = build('<option />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('output', () => {
        const el = build('<output />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['status'],
          roles: '*',
        });
      });

      it('param', () => {
        const el = build('<param />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('picture', () => {
        const el = build('<picture />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('progress', () => {
        const el = build('<progress />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['progressbar'],
          roles: [],
        });
      });

      it('script', () => {
        const el = build('<script />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('section', () => {
        const el = build('<section />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['region'],
          roles: [
            'alert', 'alertdialog', 'application', 'banner', 'complementary', 'contentinfo',
            'dialog', 'document', 'log', 'main', 'marquee', 'navigation', 'search', 'status',
          ],
        });
      });

      it('select', () => {
        const el = build('<select />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listbox'],
          roles: [],
        });
      });

      it('source', () => {
        const el = build('<source />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('span', () => {
        const el = build('<span />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('style', () => {
        const el = build('<style />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('svg', () => {
        const el = build('<svg />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('summary', () => {
        const el = build('<summary />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('table', () => {
        const el = build('<table />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['table'],
          roles: '*',
        });
      });

      it('template', () => {
        const el = build('<template />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('textarea', () => {
        const el = build('<textarea />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('tbody', () => {
        const el = build('<tbody />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('thead', () => {
        const el = build('<thead />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('tfoot', () => {
        const el = build('<tfoot />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('title', () => {
        const el = build('<title />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('td', () => {
        const el = build('<td />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['cell'],
          roles: '*',
        });
      });

      [
        'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'time',
        'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark',
        'ruby', 'rc', 'rtc', 'rt', 'rp', 'bdi', 'bdo', 'br', 'wbr',
      ].forEach((name) => {
        it(name, () => {
          const el = build(`<${name} />`);
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });
      });

      it('th', () => {
        const el = build('<th />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['columnheader', 'rowheader'],
          roles: '*',
        });
      });

      it('tr', () => {
        const el = build('<tr />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['row'],
          roles: '*',
        });
      });

      it('track', () => {
        const el = build('<track />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('ul', () => {
        const el = build('<ul />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: [
            'directory', 'group', 'listbox', 'menu', 'menubar', 'tablist',
            'toolbar', 'tree', 'presentation',
          ],
        });
      });

      it('video', () => {
        const el = build('<video />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application'],
        });
      });
    });
  });

  describe('#getRole', () => {
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
});
