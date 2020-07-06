const assert = require('assert');
const { default: mid } = require('../../dist');

describe('Testing application context: ',  () => {
  const first = mid();
  const second = mid();
  
  first.context.someVariable = 'Hello there.';
  
  it('should have global appFirst property - `someVariable`', () => {
    first.use((ctx, next) => {
      assert.strictEqual(ctx.someVariable, 'Hello there.');
      next();
    }).init();
    
    first.send('/', null);
  });
  
  it('should not affect the original prototype', () => {
    second.use((ctx, next) => {
      assert.strictEqual(ctx.someVariable, undefined);
      next();
    }).init();
    
    second.send('/', null);
  });
});