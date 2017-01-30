({
  message: 'element must have a label',
  selector: 'area[href]',
  includeHidden: true,
  filter: (el) => {
    const map = el.closest('map');
    if (!map || !map.name) {
      return true;
    }
    const img = $(`img[usemap="#${cssEscape(map.name)}"]`);
    if (!img || utils.hidden(img)) {
      return true;
    }
    return !!el.alt;
  },
});
