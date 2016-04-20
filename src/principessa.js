import { validate, resolveAssets } from './utils'

export const defaultConfig = {}

export default function (/* customConfig = {} */) {
  // const config = Object.assign({}, defaultConfig, customConfig)
  return {
    execute({ payload, onRun, onComplete, onError }) {
      // validate payload
      const valid = validate(payload)
      if (!valid) {
        onError(validate.errors)
        return Promise.resolve()
      }
      // resolve assets
      return resolveAssets(payload)
        .then(options => onRun(options))
        .then(() => {
          if (onComplete) {
            onComplete()
          }
        })
    },
  }
}
