/**
 * Rules for aria properties
 *
 * https://w3c.github.io/html-aria/
 */

module.exports = {
  alert: {
    allowed: ['expanded'],
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
  },
  checkbox: {
    required: ['checked'],
    nameFromContent: true,
  },
  columnheader: {
    allowed: ['sort', 'readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  combobox: {
    required: ['expanded'],
    allowed: ['autocomplete', 'required', 'activedescendant'],
  },
  complementary: {
    allowed: ['expanded'],
  },
  contentinfo: {
    allowed: ['expanded'],
  },
  definition: {
    allowed: ['expanded'],
  },
  dialog: {
    allowed: ['expanded'],
  },
  directory: {
    allowed: ['expanded'],
  },
  document: {
    allowed: ['expanded'],
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
  },
  gridcell: {
    allowed: ['readonly', 'required', 'selected', 'expanded'],
    nameFromContent: true,
  },
  group: {
    allowed: ['activedescendant', 'expanded'],
  },
  heading: {
    allowed: ['level', 'expanded'],
    nameFromContent: true,
  },
  img: {
    allowed: ['expanded'],
  },
  link: {
    allowed: ['expanded'],
    nameFromContent: true,
  },
  list: {
    allowed: ['expanded'],
  },
  listbox: {
    allowed: ['multiselectable', 'required', 'expanded', 'activedescendant', 'expanded'],
  },
  listitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded'],
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
  },
  menubar: {
    allowed: ['activedescendant'],
  },
  menuitem: {
    nameFromContent: true,
  },
  menuitemcheckbox: {
    required: ['checked'],
    nameFromContent: true,
  },
  menuitemradio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  navigation: {
    allowed: ['expanded'],
  },
  note: {
    allowed: ['expanded'],
  },
  option: {
    allowed: ['checked', 'posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  presentation: {},
  progressbar: {
    allowed: ['valuemax', 'valuemin', 'valuenow', 'valuetext'],
  },
  radio: {
    required: ['checked'],
    allowed: ['posinset', 'selected', 'setsize'],
    nameFromContent: true,
  },
  radiogroup: {
    allowed: ['required', 'activedescendant', 'expanded'],
  },
  region: {
    allowed: ['expanded'],
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
  },
  treegrid: {
    allowed: ['level', 'multiselecteable', 'readonly', 'activedescendant', 'expanded', 'required'],
  },
  treeitem: {
    allowed: ['level', 'posinset', 'setsize', 'expanded', 'checked', 'selected'],
  },
};
