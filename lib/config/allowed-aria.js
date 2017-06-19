/**
 * Aria rules for a HTML element
 *
 * https://w3c.github.io/html-aria/
 */
const { $$ } = require('../utils/selectors.js');

/**
 * Describes what roles and aria attributes all allowed on an element
 *
 * @typedef {Object} allowedAria
 * @property {String} selector
 * @property {String[]} implicitRoles
 * @property {String[]} roles
 * @property {Boolean} anyRole
 */

/**
 * Generate a rule
 * @returns {allowedAria}
 */
function rule({ selector = '*', implicit = [], roles = [], anyRole = false, ariaForImplicit = false, noAria = false }) {
  return {
    selector,
    implicit: [].concat(implicit),
    roles: anyRole ? '*' : roles,
    noAria,
    ariaForImplicit,
  };
}

// Common rules
// TODO: include aria attribute rules
const noRoleOrAria = rule({ noAria: true });
const noRole = rule({});
const anyRole = rule({ anyRole: true });

/** @enum {(allowedAria|allowedAria[])} */
module.exports = {
  _default: anyRole,
  a: [
    rule({
      selector: '[href]',
      implicit: 'link',
      roles: [
        'button', 'checkbox', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'option', 'radio', 'tab', 'switch', 'treeitem',
      ],
      ariaForImplicit: true,
    }),
    rule({
      selector: ':not([href])',
      anyRole: true,
    }),
  ],
  address: anyRole,
  area: [
    rule({
      selector: '[href]',
      implicit: 'link',
      ariaForImplicit: true,
    }),
  ],
  article: rule({
    implicit: 'article',
    roles: ['feed', 'presentation', 'document', 'application', 'main', 'region'],
  }),
  aside: rule({
    implicit: 'complementary',
    roles: ['feed', 'note', 'region', 'search'],
  }),
  audio: rule({
    roles: ['application'],
  }),
  base: noRoleOrAria,
  body: rule({
    implicit: ['document'],
    ariaForImplicit: true,
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
  canvas: anyRole,
  caption: noRole,
  col: noRoleOrAria,
  colgroup: noRoleOrAria,
  data: anyRole,
  datalist: rule({
    implicit: 'listbox',
    ariaForImplicit: true,
  }),
  dd: rule({
    implicit: 'definition',
    ariaForImplicit: true,
  }),
  details: rule({
    implicit: 'group',
    ariaForImplicit: true,
  }),
  dialog: rule({
    implicit: 'dialog',
    roles: ['alertdialog'],
    ariaForImplicit: true,
  }),
  div: anyRole,
  dl: rule({
    implicit: 'list',
    roles: ['group', 'presentation'],
  }),
  dt: rule({
    implicit: 'listitem',
    ariaForImplicit: true,
  }),
  embed: rule({
    roles: ['application', 'document', 'presentation', 'img'],
  }),
  fieldset: rule({
    roles: ['group', 'presentation'],
  }),
  figcaption: rule({
    roles: ['group', 'presentation'],
  }),
  figure: rule({
    implicit: 'figure',
    roles: ['group', 'presentation'],
  }),
  footer: [
    rule({
      selector(el, aria) {
        const selector = ['article', 'aside', 'main', 'nav', 'section'].map(name => `:scope ${name} footer`).join(',');
        return $$(selector, aria.closestRole(el, ['application', 'document'], { exact: true }))
          .includes(el);
      },
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
      selector(el, aria) {
        const selector = ['article', 'aside', 'main', 'nav', 'section'].map(name => `:scope ${name} header`).join(',');
        return $$(selector, aria.closestRole(el, ['application', 'document'], { exact: true }))
          .includes(el);
      },
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
    ariaForImplicit: true,
  }),
  html: noRoleOrAria,
  iframe: rule({
    roles: ['application', 'document', 'img'],
  }),
  img: [
    rule({
      selector: '[alt=""]',
      roles: ['presentation', 'none'],
      aria: false,
    }),
    rule({
      implicit: 'img',
      anyRole: true,
    }),
  ],
  input: [
    rule({
      selector: '[list]:not([type]),[list][type=text],[list][type=search],[list][type=tel],[list][type=url],[list][type=email]',
      implicit: 'combobox',
      ariaForImplicit: true,
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
      selector: ':not([type]),[type=tel],[type=text],[type=url]',
      implicit: 'textbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=email]',
      implicit: 'textbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=hidden]',
      aria: false,
    }),
    rule({
      selector: '[type=number]',
      implicit: 'spinbutton',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'radio',
      roles: ['menuitemradio'],
    }),
    rule({
      selector: '[type=range]',
      implicit: 'slider',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=reset],[type=submit]',
      implicit: 'button',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=search]',
      implicit: 'searchbox',
      ariaForImplicit: true,
    }),
    noRole,
  ],
  ins: anyRole,
  del: anyRole,
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
    ariaForImplicit: true,
  }),
  map: noRoleOrAria,
  math: rule({
    implicit: 'math',
    ariaForImplicit: true,
  }),
  menu: [
    rule({
      selector: '[type=context]',
      implicit: 'menu',
      ariaForImplicit: true,
    }),
  ],
  menuitem: [
    rule({
      selector: '[type=command]',
      implicit: 'menuitem',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=checkbox]',
      implicit: 'menuitemcheckbox',
      ariaForImplicit: true,
    }),
    rule({
      selector: '[type=radio]',
      implicit: 'menuitemradio',
      ariaForImplicit: true,
    }),
  ],
  meta: noRoleOrAria,
  meter: rule({
    implicit: 'progressbar',
  }),
  nav: rule({
    implicit: 'navigation',
    ariaForImplicit: true,
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
    ariaForImplicit: true,
  }),
  option: [
    rule({
      selector: 'select>option,select>optgroup>option,datalist>option',
      implicit: 'option',
      ariaForImplicit: true,
    }),
    noRoleOrAria,
  ],
  output: rule({
    implicit: 'status',
    anyRole: true,
  }),
  param: noRoleOrAria,
  picture: noRoleOrAria,
  progress: rule({
    implicit: 'progressbar',
    ariaForImplicit: true,
  }),
  script: noRoleOrAria,
  section: rule({
    implicit: 'region',
    roles: [
      'alert', 'alertdialog', 'application', 'banner', 'complementary',
      'contentinfo', 'dialog', 'document', 'feed', 'log', 'main', 'marquee',
      'navigation', 'search', 'status', 'tabpanel',
    ],
  }),
  select: rule({
    implicit: 'listbox',
    roles: ['menu'],
    ariaForImplicit: true,
  }),
  source: noRoleOrAria,
  span: anyRole,
  style: noRoleOrAria,
  svg: rule({
    roles: ['application', 'document', 'img'],
  }),
  summary: rule({
    implicit: 'button',
    ariaForImplicit: true,
  }),
  table: rule({
    implicit: 'table',
    anyRole: true,
  }),
  template: noRoleOrAria,
  textarea: rule({
    implicit: 'textbox',
    ariaForImplicit: true,
  }),
  tbody: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  thead: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  tfoot: rule({
    implicit: 'rowgroup',
    anyRole: true,
  }),
  title: noRoleOrAria,
  td: rule({
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
  rb: anyRole,
  rtc: anyRole,
  rt: anyRole,
  rp: anyRole,
  bdi: anyRole,
  bdo: anyRole,
  br: anyRole,
  wbr: anyRole,
  th: rule({
    implicit: ['columnheader', 'rowheader'],
    anyRole: true,
  }),
  tr: rule({
    implicit: 'row',
    anyRole: true,
  }),
  track: noRoleOrAria,
  ul: rule({
    implicit: 'list',
    roles: [
      'directory', 'group', 'listbox', 'menu', 'menubar',
      'radiogroup', 'tablist', 'toolbar', 'tree', 'presentation',
    ],
  }),
  video: rule({
    roles: ['application'],
  }),
};
