Documents must have a title.

Ensure a document has a title.  And only one title element is present in the `<head>` element.

Incorrect code for this rule:
```html
  <title> </title>                       <!-- missing title -->
  <title>foo</title><title>bar</title>   <!-- multiple title elements -->
  <body><title>foo</title></body>        <!-- title is not a child of <head> -->
  <title>foo</title><title>bar</title>   <!-- more than one title element -->
```

Correct code for this rule:
```html
  <title>Foo</title>
```

### Options:

* `emptyTitle` - string - if the title equals this value it will also considered empty.  This is useful
                          for systems that automatically add a prefix of suffix to the page title.


Incorrect code for this rule option:
```html
  <!-- emptyTitle: "Foo -" -->
  <title>Foo - </title>
```

Correct code for this rule:
```html
  <title>Foo - Bar</title>
```

### Related specifications:

* https://www.w3.org/TR/html52/document-metadata.html#the-title-element
