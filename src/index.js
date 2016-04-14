import initAjv from 'ajv'

const ajv = initAjv({ removeAdditional: true })
export const validate = ajv.compile({
  type: 'object',
  properties: {
    assets: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'string',
        },
      },
    },
    options: {
      type: 'object',
    },
  },
  required: ['options'],
  additionalProperties: false,
})

export const moveAssetsToOptions = ({ options, assets }) =>
  Object.assign({}, options, assets)

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
      // move all assets to options
      const optionsWithAssets = moveAssetsToOptions(payload)
      // call onRun method with options
      return onRun(optionsWithAssets).then(() => {
        if (onComplete) {
          onComplete()
        }
      })
    },
  }
}
