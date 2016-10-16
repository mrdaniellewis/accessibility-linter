({
  message: 'all form elements must have a label',
  selector: 'input,select,textarea',
  filter(el) {
    if (/^(?:submit|reset|button|image|hidden)$/.test(el.type)) {
      return true;
    }

    let label;

    if (el.hasAttribute('aria-labelledby')) {
      label = $(`#${el.getAttribute('aria-labelledby')}`);
    }

    if (!label && el.hasAttribute('aria-label')) {
      label = { textContent: el.getAttribute('aria-label') };
    }

    if (!label) {
      if (el.id) {
        label = $(`label[for="${cssEscape(el.id)}"]`);
      }
      if (!label) {
        label = el.closest('label');
      }
    }

    return label && label.textContent.trim();
  },
});
