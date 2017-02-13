/**
 *  Aria properties
 */

/**
 * Describes an aria value
 *
 * @typedef {Object} ariaValue
 * @property {String} type One of string, integer, number, id, idlist, token, tokenlist
 * @property {String[]} tokens
 * @property {String[]} alone
 */

/**
 * Describes an aria property
 *
 * @typedef {Object} ariaProperty
 * @property {ariaValue} values
 * @property {Boolean} global
 */

const boolean = {
  type: 'true/false',
  tokens: ['true', 'false'],
};

const tristate = {
  type: 'tristate',
  tokens: ['true', 'false', 'mixed', 'undefined'],
};

const nilableBoolean = {
  type: 'true/false/undefined',
  tokens: ['true', 'false', 'undefined'],
};


/** @enum {ariaProperty} */
module.exports = {
  activedescendant: {
    values: { type: 'id' },
  },
  atomic: {
    values: boolean,
    global: true,
  },
  autocomplete: {
    values: {
      type: 'token',
      tokens: ['inline', 'list', 'both', 'none'],
    },
  },
  busy: {
    values: boolean,
    global: true,
  },
  checked: {
    values: tristate,
  },
  colcount: {
    values: { type: 'integer' },
  },
  colindex: {
    values: { type: 'integer' },
  },
  colspan: {
    values: { type: 'integer' },
  },
  controls: {
    values: { type: 'idlist' },
    global: true,
  },
  current: {
    values: {
      type: 'token',
      tokens: ['page', 'step', 'location', 'date', 'time', 'true', 'false'],
    },
    global: true,
  },
  describedby: {
    values: { type: 'idlist' },
    global: true,
  },
  details: {
    values: { type: 'id' },
    global: true,
  },
  disabled: {
    values: boolean,
    global: true,
  },
  dropeffect: {
    values: {
      type: 'tokenlist',
      tokens: ['copy', 'execute', 'link', 'move', 'none', 'popup'],
      alone: ['none'],
    },
    deprecated: true,
    global: true,
  },
  errormessage: {
    values: { type: 'id' },
    global: true,
  },
  expanded: {
    values: nilableBoolean,
  },
  flowto: {
    values: { type: 'idlist' },
    global: true,
  },
  grabbed: {
    values: nilableBoolean,
    deprecated: true,
    global: true,
  },
  haspopup: {
    values: {
      type: 'token',
      tokens: ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'],
    },
    global: true,
  },
  hidden: {
    values: nilableBoolean,
    global: true,
  },
  invalid: {
    values: {
      type: 'token',
      tokens: ['grammar', 'false', 'spelling', 'true'],
    },
    global: true,
  },
  keyshortcuts: {
    values: { type: 'string' },
    global: true,
  },
  label: {
    values: { type: 'string' },
    global: true,
  },
  labelledby: {
    values: { type: 'idlist' },
    global: true,
  },
  level: {
    values: { type: 'integer' },
  },
  live: {
    values: {
      type: 'token',
      tokens: ['assertive', 'off', 'polite'],
    },
    global: true,
  },
  modal: {
    values: boolean,
  },
  multiline: {
    values: boolean,
  },
  multiselectable: {
    values: boolean,
  },
  orientation: {
    values: {
      type: 'token',
      tokens: ['horizontal', 'undefined', 'vertical'],
    },
  },
  owns: {
    values: { type: 'idlist' },
    global: true,
  },
  placeholder: {
    values: { type: 'string' },
  },
  posinset: {
    values: { type: 'integer' },
  },
  pressed: {
    values: tristate,
  },
  readonly: {
    values: boolean,
  },
  relevant: {
    values: {
      type: 'tokenlist',
      tokens: ['additions', 'all', 'removals', 'text'],
      alone: ['all'],
    },
    global: true,
  },
  required: {
    values: boolean,
  },
  roledescription: {
    values: { type: 'string' },
    global: true,
  },
  rowcount: {
    values: { type: 'integer' },
  },
  rowindex: {
    values: { type: 'integer' },
  },
  rowspan: {
    values: { type: 'integer' },
  },
  selected: {
    values: nilableBoolean,
  },
  setsize: {
    values: { type: 'integer' },
  },
  sort: {
    values: {
      type: 'token',
      tokens: ['ascending', 'descending', 'none', 'other'],
    },
  },
  valuemax: {
    values: { type: 'number' },
  },
  valuemin: {
    values: { type: 'number' },
  },
  valuenow: {
    values: { type: 'number' },
  },
  valuetext: {
    values: { type: 'string' },
  },
};
