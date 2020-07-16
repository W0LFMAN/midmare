const assert = require('assert');
const { Application: { Application }, Route: {Route}, Context: { Context } } = require('midmare');

describe('Testing `Route` functionality: ', () => {
  it('should initialize route: ', () => {
    assert.doesNotThrow(() => {
      new Route('/path', function get(ctx, next) { next(); }, { prefix: '' });
    });
  });
  
  it('should throw error when middleware is not a function: ', () => {
    assert.throws(() => {
      new Route('/path', 'some wrong middleware');
    }, TypeError);
  });
  
  it('should test full functionality of `Route` ', () => {
    const path = '/lalka/path/123/456';
    const route = new Route('/path/:id/:param2', [(_, next) => { next(); }], { strict: true }).setPrefix('/lalka');
    
    const captures = route.captures(path);
    const params = route.params(captures, {});
    const matches = route.match(path);
    
    assert.deepStrictEqual(captures, ['123', '456']);
    assert.deepStrictEqual(params, { id: '123', param2: '456' });
    assert.strictEqual(matches, true);
    
    route.param('id', (param, ctx, next) => {
      assert.doesNotThrow(() => {
          assert.deepStrictEqual(ctx.params, { id: '123', param2: '456' });
      });
      next();
    });

    const mwWithParamName = (mw => (mw.param = 'param2', mw))((param, ctx, next) => {
      assert.strictEqual(param, '123');
    });

    route.param('id', mwWithParamName);

    const context = Object.create(new Context({ path, app: new Application }));
    context.__pathStory = new Set;
    context.params = params;
    
    Application.createCompose(route.stack)(context).catch(err => console.log(err));
  });
});