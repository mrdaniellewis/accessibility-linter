# Website accessibility linter

A script that can be included on a web page that will check for accessibility errors and log any errors to the JavaScript error console.

## Usage

### Bookmarklet

Hop along to http://www.example.com and create yourself a bookmarklet.

### Script

Include the `standalone` script on your page.  The script offers several methods to set the configuration of the linter.

**_TODO_: Configuration methods**

### Disabling rules

Rules can be disabled for individual elements using data attributes.  By default the attributes is `data-linter-disable`.  If the value is empty all rules are disabled, or the value can be a comma separated list of rule names.

This disables the rules for that element only.  Rules will still apply to the elements subtree.

### API

Include the `umd` script on your page and run using the api.  If you page doesn't have a loading system `AccessibilityLinter` will be setup as a global.

## API

### `new AccessibilityLinter(options)`

Constructs a new accessibility linter. The linter is made up of:

* **rules**: the rules a page must obey.  These can generate warnings and errors.
* **observerss**: these watch for changes on a page and run rules in response.
* **reporters**: these report warnings and errors.  The standard reporter reports to the console.

#### Options

* **`rules`** A Map/Object of rules to add to the linter.  If not supplied this defaults to the built in rules.
* **`ruleConfig`** A Map/Object of configuration options for the rules.  If not supplied this defaults to `AcessibilityLinter.recommendedConfig`.
* **`observers`** An array of observers to add to the linter.  If not supplied this defaults to the available built in watchers.
* **`reporters`** An array of reporters to add to the linter. If not supplied this defaults to the console reporter.
* **`whitelist`** Global whitelist for all rules
* **`attributeName`** The data attribute name to use for disabling rules.  Defaults to `linter-disable`.

#### Methods

* **`run(element = document)`** Run all the configured rules against element and its subtree.  Optionally specify which rules to run.
* **`runRule(rule, { element = document, whitelist = null })`** Run a single rule against the element.  Rule can be a rule class, or the name of a configured rule.  A whitelist css selector can be supplied.
* **`observe(element = document)`** Run all the configured rules and start watching the element and its subtree for changes.
* **`disconnect`** Stop watching for changes.

#### Configuring rules

`ruleCondig` is an Object/Map of configuration options for rules.  Rules take the following configuration options:

* **`whitelist`** A selector for whitelisting elements
* **`type`** 'off', 'warning' or 'error'.

Any other options are passed to the rule.

### `new Observer(callback)`

An observer.  Observers should have the following signature:

* **`observe(element)`** Start observing the provided element.
* **`disconnect()`** Stop observing

`callback` will be called with an array of modified elements.

Built in observers are:

#### **`AccessibilityLinter.MutationObserver`**

An observer based on the DOM `MutationObserver`.  It will observe for any and all changes to an element.

#### **`AccessibilityLinter.EventObserver`** Observes for events being triggered.

Observer for the following events being called on elements: `focus`, `blur`, `load`, `error`, `transitionend`.

#### **`AccessibilityLinter.CssObserver`**

Observes for events that will trigger css pseudo classes: specifically `:hover`, `:focus-within` and `:active`.

This works by parsing css for these selectors using these classes and adding appropriate delegated event listeners what will only fire on these selectors.

#### **`AccessibilityLinter.HashObserver`**

Observes for changes in the hash what will activate or deactivate the `:target` pseudo class.

### `new Reporter()`

A reporter.  Reporters have the signature:

* **`error(element, message, rule)`**
* **`warn(element, message, rule)`**

There is one build in reporter:

#### **`AccessibilityLinter.ConsoleReporter`**

Reports errors and warnings to the console.

### `new Rule(options)`

A rule.  Generic rules have the signature:

Class properties:
* **`name`** The name of the test

Instance properties:
* **`run(element, skip)`** Run a rule and return an array of failures.  `skip(element)` is a method that will return a boolean value of whether the element should be skipped.  This is true if it is whitelisted or the error has already been reported.

`Rule` can be extended and has the following connivence methods that can be overridden.  These properties can also be passed in using the `options` argument.

* **`selector`** A getter returning a selector to find matching elements.  Defaults to `*`.  Can be provided to `options` as a string.  This is used both in `matches` _and_ `querySelectorAll`.
* **`filter(element)`** A function to filter matching elements.  Returns a boolean.  Defaults to `() => true`.
* **`message(element)`** A function to create an error message.  Must be overridden.  Can be provided to `options` as a string.

For built in rules see the documentation at ***TODO***.



