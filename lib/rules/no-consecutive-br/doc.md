Do not allow multiple consecutive `<br>` elements.

Consecutive `<br>` elements implies the author is trying to create additional padding or margin
using `<br>` elements.  Page layout is better done using CSS.  This usage will create inflexible layouts
that may not work on different screen sizes.

Incorrect code for this rule:
```html
  <p><br><br><br></p>
  <p><br> <br> <br></p>
```

Correct code for this rule:
```html
  <p>
    Address line 1<br>
    Address line 2<br>
    Town<br>
    Country
  </p>
```
