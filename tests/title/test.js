({
  message: 'document must have a title',
  selector: 'html',
  filter() {
    return document.title.trim();
  },
});

