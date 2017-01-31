({
  message(el) {
    if (!el.name) {
      return 'map elements should have a name';
    }

    const name = el.name.toLowerCase();
    const mapNames = $$('map[name]').map(map => map.name.toLowerCase());
    if (mapNames.filter(item => item === name).length > 1) {
      return 'map element names must be case-insensitively unique';
    }

    const imgUseMaps = $$('img[usemap]').map(img => img.useMap.toLowerCase());
    if (!imgUseMaps.includes(`#${name}`)) {
      return 'map elements should be referenced by an img usemap attribute';
    }

    return null;
  },
  selector: 'map',
  filter(el) { return !this.message(el); },
  includeHidden: true,
});