All anchor names should be valid and unique.

Anchor names are a legacy feature.  If used they must not be empty and must be unique amongst
other anchor names and ids.

Incorrect code for this rule:
```html
  <a name="foo" /><a name="foo" />  <!-- Duplicate name -->
  <a name="" />                     <!-- Empty name-->
  <a id="foo" name="bar" />         <!-- Id and name do not match -->
  <a name="foo" /><div id="foo" />  <!-- Duplicate name and id -->
```

Correct code for this rule:
```html
  <a name="foo bar" />              <!-- Names can be any value -->
```

### Related specifications:

* https://www.w3.org/TR/html52/obsolete.html#obsolete-but-conforming-features
