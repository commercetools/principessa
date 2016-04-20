import test from 'ava'
import {
  validate, moveAssetsToOptions, getStorageProvider, downloadAssets,
  resolveAssets, __RewireAPI__ as utilsRewireApi,
} from '../../src/utils'
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

test('validate - should accept a payload with storage provider s3', t => {
  const payload = {
    options: {},
    storageProvider: 's3',
  }
  const actual = validate(payload)

  t.is(actual, true)
})

test('validate - should not accept a payload with storage provider s4', t => {
  const payload = {
    options: {},
    storageProvider: 's4',
  }
  const actual = validate(payload)

  t.is(actual, false)
})

test('validate - should accept a payload with storage provider config', t => {
  const payload = {
    options: {},
    storageProvider: 's3',
    storageProviderConfig: { bucket: 'chicken-wings' },
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

test('moveAssetsToOptions - should not do anything if there are no assets', t => {
  const payload = {
    options: { someOption: true },
  }
  const options = {
    someOption: true,
  }
  const actual = moveAssetsToOptions(payload)

  t.deepEqual(actual, options)
})

test(`getStorageProvider - should return object with download method
for valid storage provider key`, t => {
  const storageProvider = getStorageProvider('s3', {})
  t.is(typeof storageProvider, 'object')
  t.is(typeof storageProvider.download, 'function')
})
test('getStorageProvider - should return null for invalid storage provider keys'
, t => {
  const storageProvider = getStorageProvider('')
  t.is(storageProvider, null)
})

test('downloadAssets - should call the providers download method for each asset'
, t => {
  const provider = {
    download: sinon.stub().returns(Promise.resolve('test.csv')),
  }
  return downloadAssets(provider, [{}, {}]).then((assets) => {
    t.is(provider.download.callCount, 2)
    t.deepEqual(assets, ['test.csv', 'test.csv'])
  })
})

test('resolveAssets - should call getStorageProvider with the given provider type'
, t => {
  const { context: { getStorageProviderSpy } } = t
  const payload = {
    storageProvider: 's3',
  }
  resolveAssets(payload)
  t.is(getStorageProviderSpy.calledOnce, true)
  t.is(getStorageProviderSpy.firstCall.args[0], 's3')
})
