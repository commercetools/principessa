import test from 'ava'
import { uploadOutputs } from '../src/utils'
import { __RewireAPI__ as principessaRewireApi } from '../src/principessa.js'
import container from '../src'
import sinon from 'sinon'

/* eslint-disable no-param-reassign, no-underscore-dangle */
test.beforeEach(t => {
  const getStorageProviderSpy = sinon.spy(() =>
    ({
      download: () => Promise.resolve('local.csv'),
      upload: () => Promise.resolve('http://some.url.com'),
    })
  )
  const uploadOutputsSpy = sinon.spy(uploadOutputs)
  const callbackRequestSpy = sinon.spy(() => Promise.resolve())
  principessaRewireApi.__Rewire__('getStorageProvider', getStorageProviderSpy)
  principessaRewireApi.__Rewire__('uploadOutputs', uploadOutputsSpy)
  principessaRewireApi.__Rewire__('callbackRequest', callbackRequestSpy)
  t.context.getStorageProviderSpy = getStorageProviderSpy
  t.context.uploadOutputsSpy = uploadOutputsSpy
  t.context.callbackRequestSpy = callbackRequestSpy
})
test.afterEach(t => {
  t.context.getStorageProviderSpy.reset()
  t.context.uploadOutputsSpy.reset()
  t.context.callbackRequestSpy.reset()
})
/* eslint-enable no-param-reassign, no-underscore-dangle */

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

test.serial(`container - should call uploadOutputs and callbackRequest with the given
output configuration`, t => {
  const payload = {
    storageProvider: 's3', storageProviderConfig: { bucket: 'chicken-wings' },
    options: {}, output: { file: 'output.csv' }, callbackUrl: 'url',
  }
  const onRun = () => Promise.resolve()
  const onComplete = () => ({ taskId: '123' })
  return container().execute({ payload, onRun, onComplete })
  .then(() => {
    t.is(t.context.uploadOutputsSpy.calledOnce, true)
    t.deepEqual(t.context.uploadOutputsSpy.firstCall.args[1], { file: 'output.csv' })
    t.is(t.context.callbackRequestSpy.calledOnce, true)
    t.is(t.context.callbackRequestSpy.firstCall.args[0], 'url')
    t.deepEqual(
      t.context.callbackRequestSpy.firstCall.args[1],
      { taskId: '123', file: 'http://some.url.com', status: 'success' }
    )
  })
})

test.serial(`container - should call callbackRequest with status "failed" when there is
an exeption in the process`, t => {
  const payload = {
    storageProvider: 's3', storageProviderConfig: { bucket: 'chicken-wings' },
    options: {}, output: { file: 'output.csv' }, callbackUrl: 'url',
  }
  const onRun = () => Promise.reject()
  const onComplete = () => null
  return container().execute({ payload, onRun, onComplete })
  .catch(() => {
    t.is(t.context.callbackRequestSpy.calledOnce, true)
    t.deepEqual(
      t.context.callbackRequestSpy.firstCall.args[0],
      { status: 'failed' }
    )
  })
})
