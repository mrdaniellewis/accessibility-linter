Ensure the document has a valid lang attribute on the `<html>` element and all uses of lang are valid.

The `lang` attribute specifies the language of the document, or a section of the document.
Amongst other things this can be used by:

* a browser to choose the correct conventions for line breaking, hyphenation, quotation marks and text rendering
* a browser to select the spell checker language
* a screen-reader to choose the correct voice and pronunciation
* a search engine to determine the language of the document

Omitting this value will cause a browser or search engine to guess the documents langauge or revert to a default.
This may have unexpected affects and could render the document useable of some users.

Incorrect code for this rule:
```html
  <html>          <!-- No lang -->
  <html lang="x"> <!-- Language code is invalid -->
  <div lang="">   <!-- Language code is empty -->
```

Correct code for this rule:
```html
  <html lang="en-GB">
  <div lang="sr-Latn-RS">
```

Related specifications:

* https://www.w3.org/TR/2017/REC-html52-20171214/dom.html#the-lang-and-xmllang-attributes
* http://www.ietf.org/rfc/bcp/bcp47.txt

