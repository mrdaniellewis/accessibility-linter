/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */

const allRoles = require('./roles');

class Rule {
  constructor({ selector = '*', implicit = [], roles = [], anyRole = false }) {
    this.selector = selector;
    this.implicitRoles = [].concat(implicit);
    this.roles = roles;
    this.anyRole = anyRole;
  }

  get allowedRoles() {
    if (this.anyRole) {
      return Object.keys(allRoles).filter(name => !this.implicitRoles.includes(name));
    }
    return this.roles;
  }
}

// Common rules
// TODO: include aria attribute rules
const noRoleOrAria = new Rule({});
const noRole = new Rule({});
const anyRole = new Rule({ anyRole: true });

// Hash of elements and rules
const rules = {
  a: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'radio', 'tab', 'switch', 'treeitem',
      ],
    }),
    new Rule({
      selector: ':not([href])',
      anyRole: true,
    }),
  ],
  address: new Rule({
    implicit: ['contentinfo'],
  }),
  area: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
    }),
  ],
  article: new Rule({
    implicit: 'article',
    roles: ['presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: new Rule({
    implicit: 'complementary',
    roles: ['note', 'region', 'search'],
  }),
  audio: new Rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: new Rule({
    implicit: ['document'],
  }),
  button: [
    new Rule({
      selector: '[type=menu]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio'],
    }),
    new Rule({
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
  datalist: new Rule({
    implicit: 'listbox',
  }),
  dd: new Rule({
    implicit: 'definition',
  }),
  details: new Rule({
    implicit: 'group',
  }),
  dialog: new Rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
  }),
  div: anyRole,
  dl: new Rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: new Rule({
    implicit: 'listitem',
  }),
  embed: new Rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: new Rule({
    roles: ['group', 'presentation'],
  }),
  figure: new Rule({
    implicit: 'figure',
    roles: ['group', 'presentation'],
  }),
  footer: [
    new Rule({
      selector: 'article footer,section footer',
      roles: ['group', 'presentation'],
    }),
    new Rule({
      implicit: 'contentinfo',
      roles: ['group', 'presentation'],
    }),
  ],
  form: new Rule({
    implicit: 'form',
    roles: ['search', 'presentation'],
  }),
  p: anyRole,
  pre: anyRole,
  blockquote: anyRole,
  h1: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h2: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h3: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h4: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h5: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  h6: new Rule({
    implicit: 'heading',
    roles: ['tab', 'presentation'],
  }),
  head: noRoleOrAria,
  header: [
    new Rule({
      selector: 'article header,section header',
      roles: ['group', 'presentation'],
    }),
    new Rule({
      implicit: 'banner',
      roles: ['group', 'presentation'],
    }),
  ],
  hr: new Rule({
    implicit: 'separator',
    roles: ['presentation'],
  }),
  html: noRoleOrAria,
  iframe: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    new Rule({
      selector: '[alt=""]',
      roles: ['presentation'],
      aria: false,
    }),
    new Rule({
      implicit: 'img',
      anyRole: true,
    }),
  ],
  input: [
    new Rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
    }),
    new Rule({
      selector: '[type=button]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch', 'tab'],
    }),
    new Rule({
      selector: '[type=image]',
      implicit: 'button',
      roles: ['link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch'],
    }),
    new Rule({
      selector: '[type=checkbox]',
      implicit: 'checkbox',
      roles: ['button', 'menuitemcheckbox', 'switch'],
    }),
    new Rule({
      selector: ':not([type]),[type=password],[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
    }),
    new Rule({
      selector: '[type=email]',
      implicit: 'textbox',
    }),
    new Rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    new Rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
    }),
    new Rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    new Rule({
      selector: '[type=range]',
      implicit: 'slider',
    }),
    new Rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
    }),
    new Rule({
      selector: '[type=search]',
      implicit: 'searchbox',
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
  keygen: noRole,
  label: noRole,
  legend: noRole,
  li: [
    new Rule({
      selector: 'ol>li,ul>li',
      implicit: 'listitem',
      roles: [
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
        'presentation', 'separator', 'tab', 'treeitem',
      ],
    }),
  ],
  link: [
    new Rule({
      selector: '[href]',
      implicit: 'link',
      globalAria: false,
    }),
  ],
  main: new Rule({
    implicit: 'main',
  }),
  map: noRoleOrAria,
  math: new Rule({
    implicit: 'math',
  }),
  menu: [
    new Rule({
      selector: '[type=toolbar]',
      implicit: 'toolbar',
    }),
  ],
  menuitem: [
    new Rule({
      selector: '[type=command]',
      implicit: 'menuitem',
    }),
    new Rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
    }),
    new Rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
    }),
  ],
  meta: noRoleOrAria,
  meter: new Rule({
    implicit: 'progressbar',
  }),
  nav: new Rule({
    implicit: 'navigation',
  }),
  noscript: noRoleOrAria,
  object: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  ol: new Rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar', 'presentation',
      'radiogroup', 'tablist', 'toolbar', 'tree',
    ],
  }),
  optgroup: new Rule({
    implicit: 'group',
  }),
  option: [
    new Rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
    }),
    noRoleOrAria,
  ],
  output: new Rule({
    implicit: 'status',
    anyRole: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: new Rule({
    implicit: 'progressbar',
  }),
  script: noRoleOrAria,
  section: new Rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'log', 'main', 'marquee',
      'navigation', 'search', 'status',
    ],
  }),
  select: new Rule({
    implicit: 'listbox',
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: new Rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: new Rule({
    implicit: 'button',
  }),
  table: new Rule({
    implicit: 'table',
    anyRole: true,
  }),
  template: noRoleOrAria,
  textarea: new Rule({
    implicit: 'textbox',
  }),
  tbody: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  thead: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  tfoot: new Rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  title: noRoleOrAria,
  td: new Rule({
    implicit: 'cell',
    anyRole: true,
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
  th: new Rule({
    implicit: ['columnheader', 'rowheader'],
    anyRole: true,
  }),
  tr: new Rule({
    implicit: 'row',
    anyRole: true,
  }),
  track: noRoleOrAria,
  ul: new Rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar',
      'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: new Rule({
    roles: ['application'],
  }),
};

module.exports = function match(el) {
  const name = el.nodeName.toLowerCase();
  let found = rules[name];
  if (Array.isArray(found)) {
    found = found.find(item => item.selector === '*' || el.matches(item.selector));
  }
  return found || anyRole;
};
