const assert = require('assert');
const {default: mid, Application: {Application}, Context: {Context}} = require('../../dist');

describe('Testing application object: ', () => {
  
  it('should create compose of middleware: ', () => {
    let c = 1;
    const result = [];
    
    const wares = [
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
      (_, next) => {
        result.push(c++);
        next();
      },
    ];
    
    Application.createCompose(wares)(new Context({path: '/', app: new Application}));
    
    assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 6, 7]);
  });
  
  it('should throw error when middleware is not an array of functions', () => {
    assert.throws(() => {
      Application.createCompose(function ololo() {});
    }, TypeError);
    
    assert.throws(() => {
      Application.createCompose([() => {}, null]);
    }, TypeError);
  });
  
  it('should catch `next` called multiple times', () => {
    Application.createCompose([(_, next) => {
          next();
          next().catch(err => {
            assert.throws( () => {
              throw err;
            });
          });
    }])(new Context({path: '/', app: new Application}));
  });
  
  it('should send to all routes', () => {
    const app = mid();
    const result = [];
    
    app
      .use((_, next) => {
        result.push('middleware');
        next();
      })
      .process('/route/1', ctx => {
        result.push(ctx.path);
      })
      .process('/route/2', ctx => {
        result.push(ctx.path);
      })
      .process('/route/3', ctx => {
        result.push(ctx.path);
      }).init();
    
    app
      .send('/route/1', null)
      .send('/route/2', null)
      .send('/route/3', null);
    
    assert.deepStrictEqual(result, ['middleware', '/route/1', 'middleware', '/route/2', 'middleware', '/route/3']);
  });
  
  it('should catch cyclic route handling', () => {
    const app = mid();
    app
      .process('/route/1', ctx => {
        ctx.send('/route/2', null);
      })
      .process('/route/2', ctx => {
        ctx.send('/route/1', null);
      }).init();
    
    app
      .send('/route/1', null);
    
    app.on('err', (err) => {
      assert.throws(() => {
        if(err) {
          throw err;
        }
      }, Error);
    });
  });
  
  it('should support async middleware', (done) => {
    const app = mid();
    const result = [];
    
    app
      .use(async (ctx, next) => {
        const rs = await new Promise((rs) => {
          setTimeout(() => rs('middleware|1'), 100);
        });
        result.push(rs);
        
        await next();
        
        result.push('run-after-all-wares');
      })
      .use((_, next) => {
        result.push('middleware|2');
        next();
      }).init();
    
    app.send('/', null);
    
    app.on('end', () => {
      assert.deepStrictEqual(result, ['middleware|1', 'middleware|2', 'run-after-all-wares']);
      done();
    });
  });
  
  it('should send from route to route and don\'t use middleware(s) again.', (done) => {
    const app = mid();
    const result = [];
    
    app
      .use((_, next) => {
        result.push('middleware');
        next();
      })
      .process('/app/send', ctx => {
        result.push(ctx.path);
        ctx.send('/route/send');
      })
      .process('/route/send', ctx => {
        result.push(ctx.path);
      }).init();
    
    app.send('/app/send', null);
  
    assert.deepStrictEqual(result, ['middleware', '/app/send', '/route/send']);
    
    app.on('stop', done);
    app.stop();
  });
  
  it('route context should save vars when sending inside routes', (done) => {
    const app = mid();
    
    app
      .use((ctx, next) => {
        assert.strictEqual(ctx.data, 'SomeOloloData');
        ctx.set('data', 'SomeOloloData1');
        next();
      })
      .process('/route/1', ctx => {
        assert.strictEqual(ctx.data, 'SomeOloloData1');
        ctx.set('data', 'SomeOloloData2');
        ctx.send('/route/2');
      })
      .process('/route/2', ctx => {
        assert.strictEqual(ctx.data, 'SomeOloloData2');
      }).init();
    
    app.on('end', () => done());
    app.on('err', err => done(err));
    
    app.send('/app/send', 'SomeOloloData');
  });
  
  it('should catch error', () => {
    const app = mid();
    
    app
      .use(async (_, next) => {
        try {
          await next();
        } catch (e) {
          assert.throws(() => {
            throw e;
          }, Error);
        }
      })
      .use((_, next) => {
        throw new Error('Ololo');
      }).init();
    
    
    app.send('*', null);
    
  });
  
  it('middleware must be a function', () => {
    const app = mid();
    
    assert.throws(() => {
      app.use(null);
    }, TypeError, 'middleware must be a function.');
    
  });
  
  it('application must be initialized', () => {
    const app = mid();
    
    assert.throws(() => {
      app.send('/', null);
    }, Error, 'Application is not initialized.');
    
  });
  
  it('helper must be function', () => {
    const app = mid();
    
    assert.throws(() => {
      app.helper(null);
    }, Error);
    
    assert.throws(() => {
      app.helper('helper', null);
    }, Error);
    
  });
  
  it('helper must be function', () => {
    const app = mid();
    const h = function () {};
    
    app.helper('h', h, {});
    app.helper('h1', h);
    
    assert.throws(() => {
      app.helper(h);
    }, Error);
    
  });
  
  it('next function should handle error', () => {
    const app = mid();
    
    app
      .use( async(ctx, next) => {
        try {
          await next();
        } catch(err) {
          assert.throws(() => {
            throw err;
          })
        }
      })
      .use(async (_, next) => {
          await next(new Error('Next error'));
      })
      .init();
    
    app.send('*', null);
  });
});

process.on('UnhandledPromiseRejectionWarning', (e) => { throw e });