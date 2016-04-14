import test from 'ava'
import container, { validate, moveAssetsToOptions } from '../src'
import sinon from 'sinon'

test('container - should export an object with a `execute` function', t => {
  t.is(typeof container, 'function', 'container should be a function')
  t.is(typeof container(), 'object', 'container() should return an object')
  t.is(typeof container().execute, 'function', 'container().execute should be a function')
})

test('container - should call the onRun callback after the payload is processed', t => {
  const payload = { options: {} }
  const onRun = sinon.stub().returns(Promise.resolve())
  container().execute({ payload, onRun })
  t.is(onRun.calledOnce, true)
  t.deepEqual(onRun.firstCall.args[0], {})
})

test('container - should call the onError callback if the payload is invalid', t => {
  const payload = {}
  const onError = sinon.spy()
  container().execute({ payload, onError })
  t.is(onError.calledOnce, true)
  t.is(Array.isArray(onError.firstCall.args[0]), true)
})

test('container - should call the onComplete callback if the service finished', t => {
  const payload = { options: {} }
  const onRun = () => Promise.resolve()
  const onComplete = sinon.spy()
  container().execute({ payload, onRun, onComplete })
  .then(() => {
    t.is(onComplete.calledOnce, true)
  })
})

test('validate - should accept a payload with an empty options array', t => {
  const actual = validate({ options: {} })

  t.is(actual, true)
})

test('validate - should accept a payload with multiple assets', t => {
  const payload = {
    options: {},
    assets: { inputFileOne: 'http://url.com', inputFileTwo: 'http://url2.com' },
  }
  const actual = validate(payload)

  t.is(actual, true)
})

test('moveAssetsToOptions - should add assets to options', t => {
  const payload = {
    options: { someOption: true },
    assets: { inputFileOne: 'http://url.com', inputFileTwo: 'http://url2.com' },
  }
  const options = {
    someOption: true,
    inputFileOne: 'http://url.com',
    inputFileTwo: 'http://url2.com',
  }
  const actual = moveAssetsToOptions(payload)

  t.deepEqual(actual, options)
})
