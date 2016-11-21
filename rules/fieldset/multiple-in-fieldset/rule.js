({
  message: 'Multiple inputs with the same name should be in a fieldset',
  selector: 'input[name]:not([type=hidden]),textarea[name],select[name]',
  filter: (el) => {
    let group;

    if (el.form) {
      const elements = el.form.elements[el.name];
      if (elements instanceof Node) {
        return true;
      }
      group = Array.from(elements).filter(elm => elm.type !== 'hidden');
    } else {
      const namePart = `[name="${cssEscape(el.name)}"]`;
      group = $$(`input${namePart}:not([type=hidden]),textarea${namePart},select${namePart}`).filter(elm => !elm.form);
    }

    return group.length === 1 || el.closest('fieldset');
  },
});
