const assert = require('assert');
const {Application: {Application}, Router: {Router}, Context: {Context}} = require('midmare');

describe('Testing `Router` functionality: ', () => {
  it('should use middleware in sync handle', () => {
    const router = new Router();
    const result = [];
    
    router.use((ctx, next) => {
      result.push(1);
      next();
    });
    
    router.use('(.*)', [(ctx, next) => {
      result.push(2);
      next();
    }]);
  
    const context = new Context({path: '/', app: new Application});
    context.__story = new Set;
    
    router.routes()(Object.create(context));
    
    assert.deepStrictEqual(result, [1, 2]);
  });
  
  it('should throw error while validation middleware', () => {
    const router = new Router();
    assert.throws(() => {
      router.use(null);
    }, TypeError);
  });
  
  it('should use sub-router', () => {
    const app =  new Application;
    const router = new Router({ prefix: '/prefix' });
    const subRouter1 = new Router();
    const subRouter2 = new Router();
    const subRouter3 = new Router();
    
    const result = [];
  
    router.param('id', (param, ctx, next) => {
      assert.doesNotThrow(() => {
        assert.strictEqual(param, '123');
      });
    
      next();
    });
    router.process('/route/:id', ctx => {
      result.push(ctx.path);
    });
    subRouter1.process('/sub-route/2', ctx => {
      result.push(ctx.path);
    });

    subRouter2.process('name', '/', ctx => {
      result.push(ctx.path);
    });
    
    router.register('/some-route/3', ctx => {
      result.push(ctx.path);
    });
    
    const route1 = subRouter2.route('name');
    const route2 = subRouter2.route('name1');
    
    assert.strictEqual(route1.name, 'name');
    assert.strictEqual(route2, false);
    
    router.use(subRouter1.routes());
    router.use('/sub-route/router', subRouter2.routes());
    router.use(subRouter3);
  
    const composed = router.routes();
    
    
    composed(Object.create(Object.assign(new Context({app, path: '/prefix/route/123'}), { __story: new Set })), () => {}); // `app.send` analogue
    composed(Object.create(Object.assign(new Context({app, path: '/prefix/sub-route/2'}), { __story: new Set })), () => {});
    composed(Object.create(Object.assign(new Context({app, path: '/prefix/sub-route/router'}), { __story: new Set })), () => {});
    composed(Object.create(Object.assign(new Context({app, path: '/prefix/some-route/3'}), { __story: new Set })), () => {});
    composed(Object.create(Object.assign(new Context({app, path: '/ololo'}), { __story: new Set })), () => {});

    assert.deepStrictEqual(result,['/prefix/route/123', '/prefix/sub-route/2', '/prefix/sub-route/router', '/prefix/some-route/3']);
  });
  
  it('should parse params', () => {
    const router = new Router();
    
    router.process('/:parameter',  ctx => {
      assert.doesNotThrow(() => {
        assert.strictEqual(ctx.params.parameter, 'some-val');
      });
    });
    const context = new Context({path: '/', app: new Application});
    context.__story = new Set;
    
    router.routes()(context, () => {});
  });
  
  it('should use middleware with path', () => {
    const router = new Router();
    const router1 = new Router();
    const result = [];
    
    router.process('/route/:id', ctx => {
      result.push(ctx.path);
    });
    
    router.use(router1.routes());
    
    const composed = router.routes();
    
    composed(Object.create(Object.assign(new Context({app: new Application, path: '/route/1'}), { __story: new Set }))); // send analogue
    composed(Object.create(Object.assign(new Context({app: new Application, path: '/route/2'}), { __story: new Set })));
    
    assert.deepStrictEqual(result,['/route/1', '/route/2']);
  });
});