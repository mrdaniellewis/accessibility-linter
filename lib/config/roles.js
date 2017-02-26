/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

/**
 * Describes an aria role
 *
 * @typedef {Object} ariaRole
 * @property {String[]} allowed
 * @property {String[]} subclass
 * @property {String[]} required Required aria properties
 * @property {Boolean} nameFromContent
 * @property {Boolean} abstract
 */

/** @enum {ariaRole} */
module.exports = {
  alert: {
    allowed: ['expanded'],
    subclass: ['alertdialog'],
  },
  alertdialog: {
    allowed: ['expanded', 'modal'],
  },
  application: {
    allowed: ['activedescendant'],
  },
  article: {
    allowed: ['expanded'],
  },
  banner: {
    allowed: ['expanded'],
  },
  button: {
    allowed: ['expanded', 'pressed'],
    nameFromContent: true,
  },
  cell: {
    nameFromContent: true,
    subclass: ['columnheader', 'gridcell', 'rowheader'],
  },
  checkbox: {
    required: ['checked'],
    nameFromContent: true,
    subclass: ['menuitemcheckbox', 'switch'],
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  command: {
    abstract: true,
    subclass: ['button', 'link', 'menuitem'],
  },
  complementary: {
    allowed: ['expanded'],
  },
  composite: {
    abstract: true,
    subclass: ['grid', 'select', 'spinbutton', 'tablist'],
  },
  contentinfo: {
    allowed: ['expanded'],
  },
  definition: {
    allowed: ['expanded'],
  },
  dialog: {
    allowed: ['expanded'],
    subclass: ['alertdialog'],
  },
  directory: {
    allowed: ['expanded'],
  },
  document: {
    allowed: ['expanded'],
    subclass: ['article'],
  },
  feed: {
    allowed: ['setsize', 'expanded'],
  },
  figure: {
    allowed: ['expanded'],
  },
  form: {
    allowed: ['expanded'],
  },
  grid: {
    allowed: ['level', 'multiselectable', 'readonly', 'activedescendant', 'expanded'],
    subclass: ['treegrid'],
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
    subclass: ['columnheader', 'rowheader'],
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
    subclass: ['row', 'select', 'toolbar'],
  },
  heading: {
    allowed: ['level', 'expanded'],
    nameFromContent: true,
  },
  img: {
    allowed: ['expanded'],
  },
  input: {
    abstract: true,
    subclass: ['checkbox', 'option', 'radio', 'slider', 'spinbutton', 'textbox'],
  },
  landmark: {
    abstract: true,
    subclass: ['banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search'],
  },
  link: {
    allowed: ['expanded'],
    nameFromContent: true,
  },
  list: {
    allowed: ['expanded'],
    subclass: ['directory', 'feed'],
  },
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
    subclass: ['treeitem'],
  },
  log: {
    allowed: ['expanded'],
  },
  main: {
    allowed: ['expanded'],
  },
  marquee: {
    allowed: ['expanded'],
  },
  math: {
    allowed: ['expanded'],
  },
  menu: {
    allowed: ['activedescendant', 'expanded'],
    subclass: ['menubar'],
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {
    nameFromContent: true,
    subclass: ['menuitemcheckbox'],
  },
  menuitemcheckbox: {
    required: ['checked'],
    nameFromContent: true,
    subclass: ['menuitemradio'],
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  navigation: {
    allowed: ['expanded'],
  },
  none: {},
  note: {
    allowed: ['expanded'],
  },
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
    subclass: ['treeitem'],
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
    subclass: ['menuitemradio'],
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  range: {
    abstract: true,
    subclass: ['progressbar', 'scrollbar', 'slider', 'spinbutton'],
  },
  region: {
    allowed: ['expanded'],
  },
  roletype: {
    abstract: true,
    subclass: ['structure', 'widget', 'window'],
  },
  row: {
    allowed: [
      'colindex', 'level', 'rowindex', 'selected', 'level', 'selected',
      'activedescendant', 'expanded',
    ],
    nameFromContent: true,
  },
  rowgroup: {
    allowed: ['activedescendant', 'expanded'],
    nameFromContent: true,
  },
  rowheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  scrollbar: {
    required: ['controls', 'orientation', 'valuemax', 'valuemin', 'valuenow'],
    allowed: ['expanded'],
  },
  search: {
    allowed: ['expanded', 'orientation'],
  },
  searchbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
  },
  section: {
    abstract: true,
    subclass: ['alert', 'cell', 'definition', 'figure', 'group', 'img', 'landmark', 'list', 'listitem', 'log', 'marquee', 'math', 'note', 'status', 'table', 'tabpanel', 'term', 'tooltip'],
  },
  sectionhead: {
    abstract: true,
    subclass: ['columnheader', 'heading', 'rowheader', 'tab'],
  },
  select: {
    abstract: true,
    subclass: ['combobox', 'listbox', 'menu', 'radiogroup', 'tree'],
  },
  separator: {
    allowed: ['valuetext'],
  },
  slider: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['orientation', 'valuetext'],
  },
  spinbutton: {
    required: ['valuemax', 'valuemin', 'valuenow'],
    allowed: ['required', 'valuetext'],
  },
  status: {
    allowed: ['expanded'],
    subclass: ['timer'],
  },
  structure: {
    abstract: true,
    subclass: ['application', 'document', 'none', 'presentation', 'rowgroup', 'section', 'sectionhead', 'separator'],
  },
  switch: {
    required: ['checked'],
    nameFromContent: true,
  },
  tab: {
    allowed: ['selected', 'expanded'],
    nameFromContent: true,
  },
  table: {
    allowed: ['colcount', 'rowcount'],
    subclass: ['grid'],
  },
  tablist: {
    allowed: ['level', 'activedescendant', 'expanded'],
  },
  tabpanel: {
    allowed: ['expanded'],
  },
  term: {
    allowed: ['expanded'],
  },
  textbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
    subclass: ['searchbox'],
  },
  timer: {
    allowed: ['expanded'],
  },
  toolbar: {
    allowed: ['activedescendant', 'expanded'],
    nameFromContent: true,
  },
  tooltip: {
    allowed: ['expanded'],
  },
  tree: {
    allowed: ['multiselectable', 'required', 'activedescendant', 'expanded'],
    nameFromContent: true,
    subclass: ['treegrid'],
  },
  treegrid: {
    allowed: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  },
  treeitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
  },
  widget: {
    abstract: true,
    subclass: ['command', 'composite', 'gridcell', 'input', 'range', 'row', 'separator', 'tab'],
  },
  window: {
    abstract: true,
    subclass: ['dialog'],
  },
};
