/**
 * Data for HTML elements.  Based on
 * - https://www.w3.org/TR/html52/
 * - https://w3c.github.io/html-aria/
 */

const utils = require('./utils');

const labels = (el) => {
  let found = [];
  // If more than one element has our ID we must be the first
  if (el.id && document.getElementById(el.id) === el) {
    found = utils.$$(`label[for="${utils.cssEscape(el.id)}"]`);
  }
  found.push(el.closest('label:not([for])'));
  return found.filter(Boolean).filter(elm => !utils.hidden(elm));
};

const obsolete = { obsolete: true };
module.exports = {
  a: {},
  abbr: {},
  acronym: obsolete,
  address: {},
  applet: obsolete,
  area: {
    nativeLabel(el) {
      return el.alt || '';
    },
  },
  article: {},
  aside: {},
  audio: {},
  b: {},
  base: {},
  basefont: obsolete,
  bdi: {},
  bdo: {},
  bgsound: obsolete,
  big: obsolete,
  blink: obsolete,
  blockquote: {},
  body: {},
  br: {},
  button: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  canvas: {},
  caption: {},
  center: obsolete,
  cite: {},
  code: {},
  col: {},
  colgroup: {},
  command: obsolete,
  data: {},
  datalist: {},
  dd: {},
  del: {},
  details: {},
  dfn: {},
  dialog: {},
  dir: obsolete,
  div: {},
  dl: {},
  dt: {},
  em: {},
  embed: {},
  fieldset: {},
  figcaption: {},
  figure: {},
  font: obsolete,
  footer: {},
  form: {},
  frame: obsolete,
  frameset: obsolete,
  h1: {},
  h2: {},
  h3: {},
  h4: {},
  h5: {},
  h6: {},
  head: {},
  header: {},
  hgroup: obsolete,
  hr: {},
  html: {},
  i: {},
  iframe: {},
  image: obsolete,
  img: {
    nativeLabel(el) {
      return el.alt || '';
    },
  },
  input: {
    nativeLabel(el) {
      if (el.type === 'hidden') {
        return null;
      }

      if (el.type === 'image') {
        return el.alt || el.value || '';
      }

      return labels(el);
    },
  },
  ins: {},
  isindex: obsolete,
  kbd: {},
  keygen: obsolete,
  label: {},
  legend: {},
  li: {},
  link: {},
  listing: obsolete,
  main: {},
  map: {},
  mark: {},
  marquee: obsolete,
  menu: {},
  menuitem: {},
  meta: {},
  meter: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  multicol: obsolete,
  nav: {},
  nextid: obsolete,
  nobr: obsolete,
  noembed: obsolete,
  noframes: obsolete,
  noscript: {},
  object: {},
  ol: {},
  optgroup: {},
  option: {},
  output: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  p: {},
  param: {},
  picture: {},
  plaintext: obsolete,
  pre: {},
  progress: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  q: {},
  rb: {},
  rp: {},
  rt: {},
  rtc: {},
  ruby: {},
  s: {},
  samp: {},
  script: {},
  section: {},
  select: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  small: {},
  source: {},
  spacer: obsolete,
  span: {},
  strike: obsolete,
  strong: {},
  style: {},
  sub: {},
  summary: {},
  sup: {},
  table: {},
  tbody: {},
  td: {},
  template: {},
  textarea: {
    nativeLabel(el) {
      return labels(el);
    },
  },
  tfoot: {},
  th: {},
  thead: {},
  time: {},
  title: {},
  tr: {},
  track: {},
  tt: obsolete,
  u: {},
  ul: {},
  var: {},
  video: {},
  wbr: {},
  xmp: obsolete,
};
