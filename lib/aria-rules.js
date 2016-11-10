/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

// Aria properties that can be used on any HTML element
const globalAria = [
  'atomic', 'busy', 'controls', 'current', 'describedby', 'details',
  'disabled', 'dropeffect', 'errormessage', 'flowto', 'grabbed',
  'haspopup', 'hidden', 'invalid', 'keyshortcuts', 'label',
  'labelledby', 'live', 'owns', 'relevant', 'roledescription',
];


// All roles and their allowed aria properties
const expanded = {
  allowed: ['expanded'],
};

const roles = {
  alert: expanded,
  alertdialog: {
    allowed: ['expanded', 'modal'],
  },
  application: {
    allowed: ['activedescendant'],
  },
  article: expanded,
  banner: expanded,
  button: {
    allowed: ['expanded', 'pressed'],
  },
  cell: {},
  checkbox: {
    required: ['checked'],
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  complementary: expanded,
  contentinfo: expanded,
  definition: expanded,
  dialog: expanded,
  directory: expanded,
  document: expanded,
  feed: {
    allowed: ['setsize', 'expanded'],
  },
  figure: expanded,
  form: expanded,
  grid: {
    allowed: ['level', 'multiselectable', 'readonly', 'activedescendant', 'expanded'],
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
  },
  heading: {
    allowed: ['level', 'expanded'],
  },
  img: expanded,
  link: expanded,
  list: expanded,
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
  },
  log: expanded,
  main: expanded,
  marquee: expanded,
  math: expanded,
  menu: {
    allowed: ['activedescendant', 'expanded'],
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {},
  menuitemcheckbox: {
    required: ['checked'],
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
  },
  navigation: expanded,
  note: expanded,
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  region: expanded,
  row: {
    allowed: [
      'colindex', 'level', 'rowindex', 'selected', 'level', 'selected',
      'activedescendant', 'expanded',
    ],
  },
  rowgroup: {
    allowed: ['activedescendant', 'expanded'],
  },
  rowheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
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
  status: expanded,
  switch: {
    required: ['checked'],
  },
  tab: {
    allowed: ['selected', 'expanded'],
  },
  table: {
    allowed: ['colcount', 'rowcount'],
  },
  tablist: {
    allowed: ['level', 'activedescendant', 'expanded'],
  },
  tabpanel: expanded,
  term: expanded,
  textbox: {
    allowed: ['activedescendant', 'autocomplete', 'multiline', 'placeholder', 'readonly', 'required'],
  },
  timer: expanded,
  toolbar: {
    allowed: ['activedescendant', 'expanded'],
  },
  tooltip: expanded,
  tree: {
    allowed: ['multiselectable', 'required', 'activedescendant', 'expanded'],
  },
  treegrid: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  treeitem: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
};

const bool = ['true', 'false'];
const tri = ['true', 'false', 'mixed'];

// Allowed aria property values
const properties = {
  activedescendant: 'id',
  atomic: bool,
  autocomplete: ['inline', 'list', 'both', 'none'],
  busy: bool,
  checked: tri,
};

exports.globalAria = globalAria;
exports.roles = roles;
exports.properties = properties;
