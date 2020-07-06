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
    
    assert.throws(() => {
      ctx.error(new Error);
    }, Error);
  });
});