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
        const el = buildHtml('<frank />');
        expect(aria.allowed(el)).toInclude({
          roles: '*',
          implicit: [],
        });
      });

      it('a element with a href', () => {
        const el = buildHtml('<a href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [
            'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
          ],
        });
      });

      it('a element without a href', () => {
        const el = buildHtml('<a />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('address', () => {
        const el = buildHtml('<address />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['contentinfo'],
          roles: [],
        });
      });

      it('area element with a href', () => {
        const el = buildHtml('<area href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [],
        });
      });

      it('article', () => {
        const el = buildHtml('<article />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['article'],
          roles: ['presentation', 'document', 'application', 'main', 'region'],
        });
      });

      it('aside', () => {
        const el = buildHtml('<aside />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['complementary'],
          roles: ['note', 'region', 'search'],
        });
      });

      it('audio', () => {
        const el = buildHtml('<audio />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application'],
        });
      });

      it('base', () => {
        const el = buildHtml('<base />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('body', () => {
        const el = buildHtml('<body />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['document'],
          roles: [],
        });
      });

      it('button', () => {
        const el = buildHtml('<button />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['checkbox', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
        });
      });

      it('button type="menu"', () => {
        const el = buildHtml('<button type="menu" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
        });
      });

      it('caption', () => {
        const el = buildHtml('<caption />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('col', () => {
        const el = buildHtml('<col />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('colgroup', () => {
        const el = buildHtml('<colgroup />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('data', () => {
        const el = buildHtml('<data />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('datalist', () => {
        const el = buildHtml('<datalist />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listbox'],
          roles: [],
        });
      });

      it('dd', () => {
        const el = buildHtml('<dd />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['definition'],
          roles: [],
        });
      });

      it('details', () => {
        const el = buildHtml('<details />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['group'],
          roles: [],
        });
      });

      it('dialog', () => {
        const el = buildHtml('<dialog />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['dialog'],
          roles: ['alertdialog'],
        });
      });

      it('div', () => {
        const el = buildHtml('<div />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('dl', () => {
        const el = buildHtml('<dl />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: ['group', 'presentation'],
        });
      });

      it('dt', () => {
        const el = buildHtml('<dt />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: [],
        });
      });

      it('embed', () => {
        const el = buildHtml('<embed />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'presentation', 'img'],
        });
      });

      it('fieldset', () => {
        const el = buildHtml('<fieldset />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('figcaption', () => {
        const el = buildHtml('<figcaption />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('figure', () => {
        const el = buildHtml('<figure />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['figure'],
          roles: ['group', 'presentation'],
        });
      });

      it('footer descendant of article or section', () => {
        const el = buildHtml('<article><footer /></article>').querySelector('footer');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('footer', () => {
        const el = buildHtml('<footer />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['contentinfo'],
          roles: ['group', 'presentation'],
        });
      });

      it('form', () => {
        const el = buildHtml('<form />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['form'],
          roles: ['search', 'presentation'],
        });
      });

      it('p', () => {
        const el = buildHtml('<p />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('pre', () => {
        const el = buildHtml('<pre />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('blockquote', () => {
        const el = buildHtml('<blockquote />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('h1', () => {
        const el = buildHtml('<h1 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h2', () => {
        const el = buildHtml('<h2 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h3', () => {
        const el = buildHtml('<h3 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h4', () => {
        const el = buildHtml('<h4 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h5', () => {
        const el = buildHtml('<h5 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('h6', () => {
        const el = buildHtml('<h6 />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['heading'],
          roles: ['tab', 'presentation'],
        });
      });

      it('head', () => {
        const el = buildHtml('<head />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('header descendant of article or section', () => {
        const el = buildHtml('<article><header /></article>').querySelector('header');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['group', 'presentation'],
        });
      });

      it('header', () => {
        const el = buildHtml('<header />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['banner'],
          roles: ['group', 'presentation'],
        });
      });

      it('hr', () => {
        const el = buildHtml('<hr />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['separator'],
          roles: ['presentation'],
        });
      });

      it('html', () => {
        const el = buildHtml('<html />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('iframe', () => {
        const el = buildHtml('<iframe />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('img with alt=""', () => {
        const el = buildHtml('<img alt="" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['presentation'],
        });
      });

      it('img', () => {
        const el = buildHtml('<img />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['img'],
          roles: '*',
        });
      });

      it('input type="button"', () => {
        const el = buildHtml('<input type="button" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
        });
      });

      it('input type="checkbox"', () => {
        const el = buildHtml('<input type="checkbox" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['checkbox'],
          roles: ['button', 'menuitemcheckbox', 'switch'],
        });
      });

      it('input type="color"', () => {
        const el = buildHtml('<input type="color" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="date"', () => {
        const el = buildHtml('<input type="date" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="datetime"', () => {
        const el = buildHtml('<input type="datetime" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="datetime-local"', () => {
        const el = buildHtml('<input type="datetime-local" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="list" without list attribute', () => {
        const el = buildHtml('<input type="email" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="file"', () => {
        const el = buildHtml('<input type="file" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="hidden"', () => {
        const el = buildHtml('<input type="hidden" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="image"', () => {
        const el = buildHtml('<input type="image" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
        });
      });

      it('input type="month"', () => {
        const el = buildHtml('<input type="month" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="number"', () => {
        const el = buildHtml('<input type="number" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['spinbutton'],
          roles: [],
        });
      });

      it('input type="password"', () => {
        const el = buildHtml('<input type="password" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="radio"', () => {
        const el = buildHtml('<input type="radio" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['radio'],
          roles: ['menuitemradio'],
        });
      });

      it('input type="range"', () => {
        const el = buildHtml('<input type="range" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['slider'],
          roles: [],
        });
      });

      it('input type="reset"', () => {
        const el = buildHtml('<input type="reset" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('input type="search" with no list attribute', () => {
        const el = buildHtml('<input type="search" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['searchbox'],
          roles: [],
        });
      });

      it('input type="submit"', () => {
        const el = buildHtml('<input type="submit" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('input type="tel" with no list attribute', () => {
        const el = buildHtml('<input type="tel" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="text" with no list attribute', () => {
        const el = buildHtml('<input type="text" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="text" with a list attribute', () => {
        const el = buildHtml('<input type="text" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="search" with a list attribute', () => {
        const el = buildHtml('<input type="search" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="tel" with a list attribute', () => {
        const el = buildHtml('<input type="tel" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="url" with a list attribute', () => {
        const el = buildHtml('<input type="url" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="email" with a list attribute', () => {
        const el = buildHtml('<input type="email" list="list" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['combobox'],
          roles: [],
        });
      });

      it('input type="time"', () => {
        const el = buildHtml('<input type="time" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('input type="url" with no list attribute', () => {
        const el = buildHtml('<input type="url" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('input type="week"', () => {
        const el = buildHtml('<input type="week" />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('ins', () => {
        const el = buildHtml('<ins />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('del', () => {
        const el = buildHtml('<del />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('label', () => {
        const el = buildHtml('<label />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('legend', () => {
        const el = buildHtml('<legend />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('li whose parent is an ol', () => {
        const el = buildHtml('<ol><li /></ol>').querySelector('li');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
        });
      });

      it('li whose parent is a ul', () => {
        const el = buildHtml('<ul><li /></ul>').querySelector('li');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listitem'],
          roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'presentation', 'separator', 'tab', 'treeitem'],
        });
      });

      it('link with a href', () => {
        const el = buildHtml('<link href="#" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['link'],
          roles: [],
        });
      });

      it('main', () => {
        const el = buildHtml('<main />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['main'],
          roles: [],
        });
      });

      it('map', () => {
        const el = buildHtml('<map />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('math', () => {
        const el = buildHtml('<math />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['math'],
          roles: [],
        });
      });

      it('menu type="toolbar"', () => {
        const el = buildHtml('<menu type="toolbar" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['toolbar'],
          roles: [],
        });
      });

      it('menuitem type="command"', () => {
        const el = buildHtml('<menuitem type="command" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitem'],
          roles: [],
        });
      });

      it('menuitem type="checkbox"', () => {
        const el = buildHtml('<menuitem type="checkbox" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitemcheckbox'],
          roles: [],
        });
      });

      it('menuitem type="radio"', () => {
        const el = buildHtml('<menuitem type="radio" />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['menuitemradio'],
          roles: [],
        });
      });

      it('meta', () => {
        const el = buildHtml('<meta />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('meter', () => {
        const el = buildHtml('<meter />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['progressbar'],
          roles: [],
        });
      });

      it('nav', () => {
        const el = buildHtml('<nav />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['navigation'],
          roles: [],
        });
      });

      it('noscript', () => {
        const el = buildHtml('<noscript />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('object', () => {
        const el = buildHtml('<object />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('ol', () => {
        const el = buildHtml('<ol />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: ['directory', 'group', 'listbox', 'menu', 'menubar', 'presentation', 'radiogroup', 'tablist', 'toolbar', 'tree'],
        });
      });

      it('optgroup', () => {
        const el = buildHtml('<optgroup />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['group'],
          roles: [],
        });
      });

      it('option within a list of options', () => {
        const el = buildHtml('<select><option /></select>').querySelector('option');
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option within a list of options in an optgroup', () => {
        const el = buildHtml('<select><optgroup><option /></optgroup></select>').querySelector('option');
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option within a datalist', () => {
        const el = buildHtml('<datalist><option /></datalist>').querySelector('option');
        expect(aria.allowed(el)).toInclude({
          implicit: ['option'],
          roles: [],
        });
      });

      it('option on its own', () => {
        const el = buildHtml('<option />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('output', () => {
        const el = buildHtml('<output />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['status'],
          roles: '*',
        });
      });

      it('param', () => {
        const el = buildHtml('<param />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('picture', () => {
        const el = buildHtml('<picture />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('progress', () => {
        const el = buildHtml('<progress />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['progressbar'],
          roles: [],
        });
      });

      it('script', () => {
        const el = buildHtml('<script />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('section', () => {
        const el = buildHtml('<section />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['region'],
          roles: [
            'alert', 'alertdialog', 'application', 'banner', 'complementary', 'contentinfo',
            'dialog', 'document', 'log', 'main', 'marquee', 'navigation', 'search', 'status',
          ],
        });
      });

      it('select', () => {
        const el = buildHtml('<select />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['listbox'],
          roles: [],
        });
      });

      it('source', () => {
        const el = buildHtml('<source />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('span', () => {
        const el = buildHtml('<span />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: '*',
        });
      });

      it('style', () => {
        const el = buildHtml('<style />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('svg', () => {
        const el = buildHtml('<svg />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application', 'document', 'img'],
        });
      });

      it('summary', () => {
        const el = buildHtml('<summary />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['button'],
          roles: [],
        });
      });

      it('table', () => {
        const el = buildHtml('<table />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['table'],
          roles: '*',
        });
      });

      it('template', () => {
        const el = buildHtml('<template />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('textarea', () => {
        const el = buildHtml('<textarea />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['textbox'],
          roles: [],
        });
      });

      it('tbody', () => {
        const el = buildHtml('<tbody />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('thead', () => {
        const el = buildHtml('<thead />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('tfoot', () => {
        const el = buildHtml('<tfoot />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['rowgroup'],
          roles: '*',
        });
      });

      it('title', () => {
        const el = buildHtml('<title />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('td', () => {
        const el = buildHtml('<td />');
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
          const el = buildHtml(`<${name} />`);
          expect(aria.allowed(el)).toInclude({
            implicit: [],
            roles: '*',
          });
        });
      });

      it('th', () => {
        const el = buildHtml('<th />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['columnheader', 'rowheader'],
          roles: '*',
        });
      });

      it('tr', () => {
        const el = buildHtml('<tr />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['row'],
          roles: '*',
        });
      });

      it('track', () => {
        const el = buildHtml('<track />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: [],
        });
      });

      it('ul', () => {
        const el = buildHtml('<ul />');
        expect(aria.allowed(el)).toInclude({
          implicit: ['list'],
          roles: [
            'directory', 'group', 'listbox', 'menu', 'menubar', 'tablist',
            'toolbar', 'tree', 'presentation',
          ],
        });
      });

      it('video', () => {
        const el = buildHtml('<video />');
        expect(aria.allowed(el)).toInclude({
          implicit: [],
          roles: ['application'],
        });
      });
    });
  });

  describe('#getRole', () => {
    it('returns null for no role', () => {
      const el = buildHtml('<div />');
      expect(aria.getRole(el)).toEqual(null);
    });

    it('returns a valid provided role', () => {
      const el = buildHtml('<div role="alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });

    it('returns a valid provided role with bad spacing', () => {
      const el = buildHtml('<div role=" alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });

    it('returns the first valid provided role', () => {
      const el = buildHtml('<div role="invalid alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });

    it('returns an implicit role', () => {
      const el = buildHtml('<input />');
      expect(aria.getRole(el)).toEqual('textbox');
    });

    it('returns an implicit role if no valid role is provided', () => {
      const el = buildHtml('<input role="invalid" />');
      expect(aria.getRole(el)).toEqual('textbox');
    });

    it('does not return abstract roles', () => {
      const el = buildHtml('<input role="widget alert" />');
      expect(aria.getRole(el)).toEqual('alert');
    });
  });

  describe('#hasRole', () => {
    it('returns false for null', () => {
      expect(aria.hasRole(null, 'none')).toEqual(false);
    });

    it('returns false for an element with no role', () => {
      const el = buildHtml('<div />');
      expect(aria.hasRole(el, 'none')).toEqual(false);
    });

    it('returns true for an element with an explicit role', () => {
      const el = buildHtml('<div role="button" />');
      expect(aria.hasRole(el, 'button')).toEqual(true);
    });

    it('returns true for an element with an implicit role', () => {
      const el = buildHtml('<button />');
      expect(aria.hasRole(el, 'button')).toEqual(true);
    });

    it('returns true for a parent superclass role', () => {
      const el = buildHtml('<button />');
      expect(aria.hasRole(el, 'command')).toEqual(true);
    });

    it('returns true for a ancestor superclass role', () => {
      const el = buildHtml('<button />');
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

    it('returns true for an matching against an array of roles', () => {
      expect(aria.hasRole('button', ['link', 'button'])).toEqual(true);
    });

    it('returns true for an matching superclass against an array of roles', () => {
      expect(aria.hasRole('button', ['link', 'command'])).toEqual(true);
    });

    it('returns false for match an array of roles that does not contain the role', () => {
      expect(aria.hasRole('button', ['link', 'scrollbar'])).toEqual(false);
    });
  });

  describe('#closestRole', () => {
    it('returns null if role is not found', () => {
      const el = appendToBody('<span />');
      expect(aria.closestRole(el, 'none')).toEqual(null);
    });

    it('returns null if a different role is found', () => {
      const el = appendToBody('<div role="button"><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), 'none')).toEqual(null);
    });

    it('returns the closest element with the role', () => {
      const el = appendToBody('<div role="none"><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), 'none')).toEqual(el);
    });

    it('returns the body for document', () => {
      const el = appendToBody('<div><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), 'document')).toEqual(document.body);
    });

    it('returns an element when checking several roles', () => {
      const el = appendToBody('<div role="none"><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), ['presentation', 'none'])).toEqual(el);
    });

    it('returns an element if fallback roles are present', () => {
      const el = appendToBody('<div role="none presentation"><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), 'none')).toEqual(el);
    });

    it('returns null if the role is a fallback role', () => {
      const el = appendToBody('<div role="none presentation"><span /></div>');
      expect(aria.closestRole(el.querySelector('span'), 'presentation')).toEqual(null);
    });
  });

  describe('#rolesOfType', () => {
    it('finds all non-abstract roles of a particular type', () => {
      expect(aria.rolesOfType('command')).toEqual(['button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio']);
    });
  });
});
