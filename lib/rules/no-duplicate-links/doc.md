Ensures all links have a unique name.

Screen readers and other assistive technologies all the user to navigate a website by generating a list of
links on a page.  These links should have sufficient link text so their purpose is clear.

Multiple links with the same name indicate unnecessary replication, poor page structure, or links with
an insufficiently descriptive name.

Incorrect code for this rule:
```html
  <a href="#">foo</a>
  <a href="#">foo</a>
```

Correct code for this rule:
```html
  <a href="#">foo</a>
  <a href="#" aria-label="bar">foo</a>
```
