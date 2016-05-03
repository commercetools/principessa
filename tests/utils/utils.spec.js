import test from 'ava'
import {
  validate, moveAssetsToOptions, getStorageProvider, downloadAssets,
  resolveAssets, uploadOutputs, callbackRequest, __RewireAPI__ as utilsRewireApi,
} from '../../src/utils'
import sinon from 'sinon'

/* eslint-disable no-param-reassign, no-underscore-dangle */
test.beforeEach(t => {
  const getStorageProviderSpy = sinon.spy(() =>
    ({ download: () => Promise.resolve('local.csv') })
  )
  const fetch = sinon.spy()
  utilsRewireApi.__Rewire__('getStorageProvider', getStorageProviderSpy)
  utilsRewireApi.__Rewire__('fetch', fetch)
  t.context.getStorageProviderSpy = getStorageProviderSpy
  t.context.fetch = fetch
})
test.afterEach(t => {
  t.context.getStorageProviderSpy.reset()
})
/* eslint-enable no-param-reassign, no-underscore-dangle */

test('validate - should accept a payload with an empty options array', t => {
  const actual = validate({ options: {} })

  t.is(actual, true)
})

test('validate - should accept a payload with multiple assets', t => {
  const payload = {
    options: {},
    assets: { inputFileOne: 'http://url.com', inputFileTwo: 'http://url2.com' },
    storageProvider: 's3',
    storageProviderConfig: {},
  }
  const actual = validate(payload)

  t.is(actual, true)
})

test('validate - should accept a payload with storage provider s3', t => {
  const payload = {
    options: {},
    storageProvider: 's3',
    storageProviderConfig: {},
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

test('validate - should accept a payload with output config', t => {
  const payload = {
    options: {},
    storageProvider: 's3',
    storageProviderConfig: { bucket: 'chicken-wings' },
    output: { outputFile: 'path.csv' },
    callbackUrl: 'url',
  }
  const actual = validate(payload)

  t.is(actual, true)
})

test('validate - should not accept a payload with output but without callbackUrl config', t => {
  const payload = {
    options: {},
    storageProvider: 's3',
    storageProviderConfig: { bucket: 'chicken-wings' },
    output: { outputFile: 'path.csv' },
  }
  const actual = validate(payload)

  t.is(actual, false)
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

test('resolveAssets - should add downloaded assets to the input options'
, t => {
  const provider = {
    download: sinon.stub().returns(Promise.resolve('local/file.csv')),
  }
  const payload = {
    assets: { asset1: 'fileNameOnFileStorage.csv', asset2: 'fileNameOnFileStorage.csv' },
    options: { outputFolder: '/some/folder' },
  }
  resolveAssets(provider, payload).then(optionsWithAssets => {
    t.is(optionsWithAssets, {
      outputFolder: '/some/folder', asset1: 'local/file.csv', asset2: 'local/file.csv',
    })
  })
})

test('uploadOutputs - should upload the configured files to storage provider', t => {
  const provider = {
    upload: sinon.stub().returns(Promise.resolve('http://utl.to.test.csv')),
  }
  const outputs = { outputFile: 'products.csv', outputFile2: 'customers.csv' }
  return uploadOutputs(provider, outputs).then(references => {
    t.is(provider.upload.firstCall.args[0], 'products.csv')
    t.is(provider.upload.secondCall.args[0], 'customers.csv')
    t.deepEqual(references, {
      outputFile: 'http://utl.to.test.csv',
      outputFile2: 'http://utl.to.test.csv',
    })
  })
})

test('callbackRequest - should do a PATCH request to the url with the given payload', t => {
  const payload = { payload: 'abc' }
  callbackRequest('url', payload)
  t.is(t.context.fetch.calledOnce, true)
  t.is(t.context.fetch.firstCall.args[0], 'url')
  t.is(t.context.fetch.firstCall.args[1].method, 'PATCH')
  t.is(t.context.fetch.firstCall.args[1].body, JSON.stringify(payload))
})
