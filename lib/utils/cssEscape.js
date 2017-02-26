module.exports = function cssEscape(name) {
  return name.replace(/["\\]/g, '\\$&');
};
