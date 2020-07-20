const assert = require('assert');
const { Application: {Application}, Context: {Context}} = require('../../dist');

describe('Testing context object: ', () => {
  it('should set data to context: ', () => {
    const context = new Context({ path: '/', app: new Application });
    context.set('someKey', 'someVal');
    
    assert.strictEqual(context.get('someKey'), 'someVal');
  });
  
  it('should throw error: ', () => {
    const ctx = new Context({ path: '/', app: new Application });
  
    ctx.app.on('error', (err) => {
      assert.throws(() => {
        throw err;
      }, Error);
    });
  
  
    ctx.error(new Error);
  });
  
  it('should clone context: ', () => {
    const context = new Context({ path: '/', app: new Application });
    context.ololo = 1;
    context.lalka = () => {};
    
    const cloned = Context.clone(context);
    
    assert.strictEqual(context.ololo, cloned.ololo);
    assert.strictEqual(context.lalka, cloned.lalka);
  });
  
});