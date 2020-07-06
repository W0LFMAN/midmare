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
    
    router.use((ctx, next) => {
      result.push(2);
      next();
    });
    
    router.routes()(Object.create(new Context({app: new Application, path: '/'})));
    
    assert.deepStrictEqual(result, [1, 2]);
  });
  
  it('should throw error while validation middleware', () => {
    const router = new Router();
    assert.throws(() => {
      router.use(null);
    }, TypeError);
  });
  
  it('should use sub-router', () => {
    const router = new Router();
    const subRouter1 = new Router({ prefix: '/prefix' });
    const subRouter2 = new Router();
    const subRouter3 = new Router();
    
    const result = [];
    
    router.process('/route/1', ctx => {
      result.push(ctx.path);
    });
    subRouter1.process('/sub-route/2', ctx => {
      result.push(ctx.path);
    });
    
    subRouter2.process('/', ctx => {
      result.push(ctx.path);
    });
    
    router.process('/route/3', ctx => {
      result.push(ctx.path);
    });
    
    router.use(subRouter1.routes());
    router.use('/sub-route/router', subRouter2.routes());
    router.use(subRouter3.routes());
  
    const composed = router.routes();
    
    composed(Object.create(new Context({app: new Application, path: '/route/1'})), () => {}); // send analogue
    composed(Object.create(new Context({app: new Application, path: '/prefix/sub-route/2'})), () => {});
    composed(Object.create(new Context({app: new Application, path: '/sub-route/router'})), () => {});
    composed(Object.create(new Context({app: new Application, path: '/route/3'})), () => {});
    
    assert.deepStrictEqual(result,['/route/1', '/prefix/sub-route/2', '/sub-route/router', '/route/3']);
  });
  
  it('should parse params', () => {
    const router = new Router();
    
    router.process('/:parameter',  ctx => {
      assert.doesNotThrow(() => {
        assert.strictEqual(ctx.params.parameter, 'some-val');
      });
    });
    
    router.param('parameter', (param, ctx, next) => {
      assert.doesNotThrow(() => {
        assert.strictEqual(param, 'some-val');
      });
      
      next();
    });
    
    router.routes()(Object.create(new Context({app: new Application, path: '/some-val'})), () => {});
  });
  
  it('should use middleware with path', () => {
    const router = new Router();
    const result = [];
    
    router.process('/route/1', ctx => {
      result.push(ctx.path);
    });
    
    router.process('/route/2', ctx => {
      result.push(ctx.path);
    });
    
    const composed = router.routes();
    
    composed(Object.create(new Context({app: new Application, path: '/route/1'}))); // send analogue
    composed(Object.create(new Context({app: new Application, path: '/route/2'})));
    
    assert.deepStrictEqual(result,['/route/1', '/route/2']);
  });
});