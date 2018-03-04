All ids should be valid and unique.

It is a requirement that all ids are unique and they do not contain spaces.
Duplicate ids are almost always a mistake and can result, for example, in anchors linking to the
wrong target or controls missing their label.

Incorrect code for this rule:
```html
  <div id="foo" /><div id="foo" /> <!-- Duplicate id -->
  <div id="" />                    <!-- Empty id -->
  <div id="foo bar" />             <!-- Id containing a space -->
```

Correct code for this rule:
```html
  <div id="⭐️" />                  <!-- Ids can be any character -->
```

Related specifications:

* https://www.w3.org/TR/html52/dom.html#element-attrdef-global-id
