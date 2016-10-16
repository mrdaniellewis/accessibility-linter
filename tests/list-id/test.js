({
  message: 'no datalist found',
  selector: 'input[list]',
  filter(el) {
    const listId = el.getAttribute('list');
    return listId && $(`datalist[id="${cssEscape(listId)}"]`);
  },
});
