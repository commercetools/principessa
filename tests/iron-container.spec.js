import test from 'ava'
import container from '../src'

test('should export an object with a `execute` function', t => {
  t.is(typeof container, 'object', 'container should be an object')
  t.is(typeof container.execute, 'function', 'container.execute should be a function')
})

test('export function should return the given param', t => {
  const config = { payload: 'a', run: () => null, onComplete: () => null }
  const actual = container.execute(config)

  t.deepEqual(actual, config)
})

// test(t => {
//     const a = /foo/;
//     const b = 'bar';
//     const c = 'baz';
//     t.true(a.test(b) || b === c);
// });
