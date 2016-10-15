defineTest({
  message: 'All checkbox groups must be within a fieldset',
  selector: 'input[type=checkbox]',
  filter: (el) => {
    if (!el.name) {
      return true;
    }

    if (el.form && !(el.form.elements[el.name] instanceof NodeList)) {
      return true;
    }

    if (!el.form && $$(`input[type=checkbox][name="${cssEscape(el.name)}"]`).filter(elm => !elm.form).length === 1) {
      return true;
    }

    return el.closest('fieldset');
  },
});
