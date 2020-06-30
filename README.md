# MIDMARE library

Minimalist library that routing functionality of program.

## Installation

This is a Node.js module available through the npm registry.

Before installing, download and install Node.js. Node.js 0.10 or higher is required.

If this is a brand new project, make sure to create a package.json first with the npm init command.

Installation is done using the npm install command:

```npm install midmare```

## Features

* Robust routing
* Focus on high performance

## Using of it

That's really preaty simple. The same way as you use an "express.js" application,
but without HTTP Layer.

```js
const mid = require('midmare');

const app = mid(); // or mid({ withListen: true });


/* 
  You can add `helper` functions and use them from `ctx`.
  Helper should be named function declaration - 
  `function nameOfFunction() { ... }`
*/
app.helper(function someHelperName(yourArg1, yourArg2) {
  console.log('Hello helper.', yourArg1, yourArg2);
} /*, second argument is binding of any context you want. To use `this` in function. */);


app
    .use(function(ctx, next) {
      ctx.user = 'Hi MID.'; // Wrong way to save your data, but works in current iteration context.
      ctx.set('user', 'Hi MID.'); // Best way to save your data
      next();
    })
    .process('/', function(ctx) {
      console.log('CTX', ctx.get('data'));
      
      
      /* Sending to another path */
      ctx.send('/some/other/path');

      if(youWantToSaveYourDataStore && doNotWantUseMiddlewaresAgain) {
        ctx.send('/some/another/path', 'SomeAnotherPathData', ctx);
          /* 
            That's gives you way to use stored in `ctx` data at next iteration
            and remember that middleware(not routes) will not iterate before `/some/another/path`
          
            Be careful to use multiple sending in one route, that can overload your app.
            And be careful with cyclic sending. App have protection from it.
          */
      }

      if(youWantUseYourHelper) {
        ctx.someHelperName('yourArg1', 'yourArg2');
      }
    });

app.init(); // or `app.listen()` if you will use option `withListen`;

/*
  `init` method ignore creating a waiter(timeout) for your functionality.
  If you will create app with `withListen` option and run `init` or `listen`, your application will not be closed until
    you will call method `stop`.
*/

/* To send to app some data you can use method `send` */

app.send('/', 'Some data that you sending.');

/* 
    If you want send data to all middleware just use regexp patters,
    this library uses same matching path as express.js app.
 */

app.send('*', 'some data');

``` 