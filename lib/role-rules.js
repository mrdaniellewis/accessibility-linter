/**
 * Rules for what an element allows
 *
 * https://w3c.github.io/html-aria/
 */

function rule(options = {}) {
  return Object.assign(
    {
      roles: false,
      aria: true,
      selector: '*',
      implicitAria: false,
    },
    options,
    {
      implicit: [].concat(options.implicit || []),
    }
  );
}

// Common rules
const noRoleOrAria = rule({ aria: false });
const noRole = rule();
const anyRole = rule({ roles: true });

exports.defaultRule = anyRole;

// Hash of elements and rules
exports.rules = {
  a: [
    rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
      ],
      implicitAria: true,
    }),
    rule({
      selector: ':not([href])',
      roles: true,
    }),
  ],
  address: rule({
    implicit: ['contentinfo'],
  }),
  area: [
    rule({
      selector: '[href]',
      implicit: 'link',
      implicitAria: true,
    }),
  ],
  article: rule({
    implicit: 'article',
    roles: ['presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: rule({
    implicit: 'complementary',
    roles: ['note', 'region', 'search'],
  }),
  audio: rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: rule({
    implicit: ['document'],
  }),
  button: [
    rule({
      selector: '[type=menu]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
    }),
    rule({
      implicit: 'button',
      roles: [
        'checkbox', 'link', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'switch', 'tab',
      ],
    }),
  ],
  caption: noRole,
  col: noRoleOrAria,
  colgroup: noRoleOrAria,
  datalist: rule({
    implicit: 'listbox',
    implicitAria: true,
  }),
  dd: rule({
    implicit: 'definition',
    implicitAria: true,
  }),
  details: rule({
    implicit: 'group',
    implicitAria: true,
  }),
  dialog: rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
    implicitAria: true,
  }),
  div: anyRole,
  dl: rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: rule({
    implicit: 'listitem',
    implicitAria: true,
  }),
  embed: rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: rule({
    roles: ['group', 'presentation'],
  }),
  figure: rule({
    implicit: 'figure',
    roles: ['group', 'presentation'],
  }),
  footer: [
    rule({
      selector: 'article footer,section footer',
      roles: ['group', 'presentation'],
    }),
    rule({
      implicit: 'contentinfo',
      roles: ['group', 'presentation'],
    }),
  ],
  form: rule({
    implicit: 'form',
    roles: ['search', 'presentation'],
  }),
  p: anyRole,
  pre: anyRole,
  blockquote: anyRole,
  h1: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h2: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h3: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h4: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h5: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h6: rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  head: noRoleOrAria,
  header: [
    rule({
      selector: 'article header,section header',
      roles: ['group', 'presentation'],
    }),
    rule({
      implicit: 'banner',
      roles: ['group', 'presentation'],
    }),
  ],
  hr: rule({
    implicit: 'separator',
    roles: ['presentation'],
    implicitAria: true,
  }),
  html: noRoleOrAria,
  iframe: rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    rule({
      selector: '[alt=""]',
      roles: ['presentation'],
      aria: false,
    }),
    rule({
      implicit: 'img',
      roles: true,
    }),
  ],
  input: [
    rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=button]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
    }),
    rule({
      selector: '[type=image]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'checkbox',
      roles: ['button', 'menuitemcheckbox', 'switch'],
    }),
    rule({
      selector: ':not([type]),[type=password],[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
    }),
    rule({
      selector: '[type=email]',
      implicit: 'textbox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
      implicitAria: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    rule({
      selector: '[type=range]',
      implicit: 'slider',
    }),
    rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
      implicitAria: true,
    }),
    rule({
      selector: '[type=search]',
      implicit: 'searchbox',
      implicitAria: true,
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
  keygen: noRole,
  label: noRole,
  legend: noRole,
  li: [
    rule({
      selector: 'ol>li,ul>li',
      implicit: 'listitem',
      roles: [
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
        'presentation', 'separator', 'tab', 'treeitem',
      ],
    }),
  ],
  link: [
    rule({
      selector: '[href]',
      implicit: 'link',
      globalAria: false,
    }),
  ],
  main: rule({
    implicit: 'main',
  }),
  map: noRoleOrAria,
  math: rule({
    implicit: 'math',
  }),
  menu: [
    rule({
      selector: '[type=toolbar]',
      implicit: 'toolbar',
      implicitAria: true,
    }),
  ],
  menuitem: [
    rule({
      selector: '[type=command]',
      implicit: 'menuitem',
      implicitAria: true,
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
      implicitAria: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
      implicitAria: true,
    }),
  ],
  meta: noRoleOrAria,
  meter: rule({
    implicit: 'progressbar',
  }),
  nav: rule({
    implicit: 'navigation',
  }),
  noscript: noRoleOrAria,
  object: rule({
    roles: ['application', 'document', 'img'],
  }),
  ol: rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar', 'presentation',
      'radiogroup', 'tablist', 'toolbar', 'tree',
    ],
  }),
  optgroup: rule({
    implicit: 'group',
  }),
  option: [
    rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
    }),
    noRoleOrAria,
  ],
  output: rule({
    implicit: 'status',
    roles: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: rule({
    implicit: 'progressbar',
    implicitAria: true,
  }),
  script: noRoleOrAria,
  section: rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'log', 'main', 'marquee',
      'navigation', 'search', 'status',
    ],
  }),
  select: rule({
    implicit: 'listbox',
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: rule({
    implicit: 'button',
    implicitAria: true,
  }),
  table: rule({
    implicit: 'table',
    roles: true,
  }),
  template: noRoleOrAria,
  textarea: rule({
    implicit: 'textbox',
  }),
  tbody: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  thead: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  tfoot: rule({
    implicit: 'rowgroup',
    roles: true,
  }),
  title: noRoleOrAria,
  td: rule({
    implicit: 'cell',
    roles: true,
  }),
  em: anyRole,
  strong: anyRole,
  small: anyRole,
  s: anyRole,
  cite: anyRole,
  q: anyRole,
  dfn: anyRole,
  abbr: anyRole,
  time: anyRole,
  code: anyRole,
  var: anyRole,
  samp: anyRole,
  kbd: anyRole,
  sub: anyRole,
  sup: anyRole,
  i: anyRole,
  b: anyRole,
  u: anyRole,
  mark: anyRole,
  ruby: anyRole,
  rt: anyRole,
  rp: anyRole,
  bdi: anyRole,
  bdo: anyRole,
  br: anyRole,
  wbr: anyRole,
  th: rule({
    implicit: ['columnheader', 'rowheader'],
    roles: true,
  }),
  tr: rule({
    implicit: 'row',
    roles: true,
  }),
  track: noRoleOrAria,
  ul: rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar',
      'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: rule({
    roles: ['application'],
  }),
};
