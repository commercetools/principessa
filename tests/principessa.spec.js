import test from 'ava'
import { __RewireAPI__ as utilsRewireApi } from '../src/utils'
import container from '../src'
import sinon from 'sinon'

/* eslint-disable no-param-reassign */
test.beforeEach(t => {
  const getStorageProviderSpy = sinon.spy(() =>
    ({ download: () => Promise.resolve('local.csv') })
  )
  utilsRewireApi.__Rewire__('getStorageProvider', getStorageProviderSpy)
  t.context.getStorageProviderSpy = getStorageProviderSpy
})
test.afterEach(t => {
  t.context.getStorageProviderSpy.reset()
})
/* eslint-enable no-param-reassign */

test('container - should export an object with a `execute` function', t => {
  t.is(typeof container, 'function', 'container should be a function')
  t.is(typeof container(), 'object', 'container() should return an object')
  t.is(typeof container().execute, 'function', 'container().execute should be a function')
})

test('container - should call the onRun callback after the payload is processed', t => {
  const payload = { options: {} }
  const onRun = sinon.stub().returns(Promise.resolve())
  return container().execute({ payload, onRun }).then(() => {
    t.is(onRun.calledOnce, true)
    t.deepEqual(onRun.firstCall.args[0], {})
  })
})

test('container - should call the onRun callback with resolved assets', t => {
  const payload = {
    storageProvider: 's3', storageProviderConfig: { bucket: 'chicken-wings' },
    assets: { inputFileOne: 'http://some.url.com' }, options: {},
  }
  const onRun = sinon.stub().returns(Promise.resolve())
  const principessa = container()
  return principessa.execute({ payload, onRun }).then(() => {
    t.is(onRun.calledOnce, true)
    t.deepEqual(onRun.firstCall.args[0], { inputFileOne: 'local.csv' })
  })
})

test('container - should call the onError callback if the payload is invalid', t => {
  const payload = {}
  const onError = sinon.spy()
  return container().execute({ payload, onError }).then(() => {
    t.is(onError.calledOnce, true)
    t.is(Array.isArray(onError.firstCall.args[0]), true)
  })
})

test('container - should call the onComplete callback if the service finished', t => {
  const payload = { options: {} }
  const onRun = () => Promise.resolve()
  const onComplete = sinon.spy()
  return container().execute({ payload, onRun, onComplete })
  .then(() => {
    t.is(onComplete.calledOnce, true)
  })
})
