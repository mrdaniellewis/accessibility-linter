Do not allow multiple consecutive non-breaking spaces.

Multiple non-breaking spaces implies the author is trying to create a minimum element width
with using text.  Page layout is better done using CSS.  This usage will create inflexible layouts
that may not work on different screen sizes.

Incorrect code for this rule:
```html
  <p>&nbsp;&nbsp;</p>
  <p>&nbsp;  &nbsp;</p>
```
