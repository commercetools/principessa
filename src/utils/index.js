import initAjv from 'ajv'
import aws from '../storage-providers/aws.js'
import payloadSchema from './schema.json'

const ajv = initAjv({ removeAdditional: true })
export const validate = ajv.compile(payloadSchema)

export const moveAssetsToOptions = ({ options, assets }) =>
  Object.assign({}, options, assets)

export const downloadAssets = (provider, assets) =>
  Promise.all(
    Object.keys(assets).map(asset =>
      provider.download(assets[asset])
      .then(assetPath => ({ [asset]: assetPath }))
    )
  ).then(resolvedAssets =>
    resolvedAssets.reduce((obj, asset) => Object.assign({}, obj, asset), {})
  )

export const getStorageProvider = (provider, config) => {
  switch (provider) {
    case 's3':
      return aws(config)
    default:
      return null
  }
}

export const resolveAssets = (payload) => {
  // create storage provider
  const {
    storageProvider: provider, storageProviderConfig, options, assets,
  } = payload
  const storageProvider =
    getStorageProvider(provider, storageProviderConfig)

  // download all assets
  return storageProvider && assets
    ? downloadAssets(storageProvider, assets)
      .then(resolvedAssets =>
        // move all resolvedAssets to options
        moveAssetsToOptions({ options, assets: resolvedAssets })
      )
    : Promise.resolve(options)
}
