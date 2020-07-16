### v1.4.9
* Fixed cycle handling
* Rewrited tests

### v1.4.8
* Small fix router prefixes.

### v1.4.7
* Added Error handling when function sync or async.

### v1.4.6
* Fixed errors handing
* to listen errors on app use `app.on('err', (err) => console.error(err)`
* Fixes at tests
* Fixes with context
* Removed `listen` method due to lack of need
* Removed idea of setTimeout endless cycle.
* Small fixes of types.

### v1.4.5
* Small type fixes
* Test coverage 100%

### v1.4.4
* Removed dist js files from code

### v1.4.3
* Readme bages added

### v1.4.2
* Test Coverage `98%`

### v1.4.1
* Test Coverage `98%`

### v1.3.2
* Fix coverage.
* Deleted `index.js`

### v1.3.0
* Removed maps dir

### v1.2.8
* Ignore test directory in `.npmignore`

### v1.2.7
* Added tests
* Added codecov

### v1.2.6
* `.npmignore` & `.gitignore` extending.

### v1.2.5
* Fixin Github Actions

### v1.2.4
* Added license

### v1.2.3
* Replaced `HttpRouter` to new npm module [a link](https://www.npmjs.com/package/midmare-http-router)
* Added gulp & uglify.
* Publishing automatically from github \[master merging].
* Added Github actions for publish

### v1.2.2
* Added `ctx.redirect` method for `HttpRouter`
* Fixed `404` middleware for `HttpRouter`.

### v1.2.0
* (Feature) Removed old functionality `Router#httpRoutes`, created `HttpRouter` nested by router.
* Changed functionality of `HttpRouter`.
* Extended `context` inside http router. Now you can use `ctx.[body, header, headers, set, get, status, message, remove, has, type, length, send, end, json]`

### v1.1.11
* Fixed app context implementation. Now context save all even after using `ctx.send`
* Deleted store inside `Context` because of no need.
* Created beta functionality `Router#httpRoutes`. Now you an use router routes in `http#createServer`.
See example in `Readme.md` 

### v1.1.10
* Fix Routing implementation

### v1.1.9
* Fix Routing implementation

### v1.1.8
* Fix Routing implementation

### v1.1.7
* Fix Routing implementation

### v1.1.6
* Fix cycle handing routes.

### v1.1.5
* FastFix `helper` implementation.

### v1.1.4
* FastFix `helper` implementation.

### v1.1.3
* FastFix `helper` binding.

### v1.1.2
* FastFix dist compile.

### v1.1.1
* Fixed new functionality `helper`, removed binding by default.

### v1.1.0
* Added new functionality `helper`.

### v1.0.2
* Fixed implementation of protection from cyclic handling routes.

### v1.0.1
* Created new option `ignoreCyclicError`
* Added throwing exception Cyclic handling.
* Added defence from Cyclic handling of routes.

### v1.0.0
* Created full functionality without tests.