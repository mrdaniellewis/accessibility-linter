// Language tags are defined in http://www.ietf.org/rfc/bcp/bcp47.txt
// This regular expression ignores reserved parts, irregular codes, extensions and private use
({
  message: el => (el.lang ? 'language code is invalid' : 'missing lang attribute'),
  selector: 'html',
  match: /^((en-gb-oed)|([a-z]{2,3}(-[a-z]{3})?(-[a-z]{4})?(-[a-z]{2}|-\d{3})?(-[a-z0-9]{5,8}|-(\d[a-z0-9]{3}))*))$/i,
  filter(el) {
    return this.match.test(el.lang);
  },
});
