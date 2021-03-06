import {
  validate, resolveAssets, uploadOutputs, callbackRequest, getStorageProvider,
} from './utils'

export default function (/* customConfig = {} */) {
  return {
    execute({ payload, onRun, onComplete, onError }) {
      // validate payload
      const valid = validate(payload)
      if (!valid) {
        onError(validate.errors)
        return Promise.resolve()
      }

      const {
        storageProvider: provider, storageProviderConfig,
        output,
        callbackUrl,
      } = payload
      const storageProvider = getStorageProvider(provider, storageProviderConfig)
      // resolve assets
      return resolveAssets(storageProvider, payload)
        .then(options => onRun(options))
        .then(() => {
          if (onComplete) {
            return onComplete()
          }
          return {}
        })
        .then(callbackPayload => {
          if (output) {
            // upload output files to s3
            return uploadOutputs(storageProvider, output).then(references =>
              // call callback with payload
              callbackRequest(callbackUrl, Object.assign(
                {},
                callbackPayload,
                { outputFiles: references },
                { status: 'success' }
              ))
            )
          }
          return Promise.resolve()
        })
        .catch((err) => {
          callbackRequest(callbackUrl, { status: 'failed' })
          throw err
        })
    },
  }
}
