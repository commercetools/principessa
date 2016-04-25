# principessa 👸
[![Travis](https://img.shields.io/travis/commercetools/principessa.svg?style=flat-square)](https://travis-ci.org/commercetools/principessa)
[![Codecov](https://img.shields.io/codecov/c/github/commercetools/principessa.svg?style=flat-square)](https://codecov.io/github/commercetools/principessa)
[![npm](https://img.shields.io/npm/l/principessa.svg?style=flat-square)](http://spdx.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)
[![NPM version][npm-image]][npm-url]

Run a given service with the ability to manage upload / download of files to a Cloud Files service

[npm-url]: https://npmjs.org/package/principessa
[npm-image]: http://img.shields.io/npm/v/principessa.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dt/principessa.svg?style=flat-square

## Gettings Started

### Example usage

```js
import principessa from 'principessa'
import myService from 'my-service'
import iron_worker from 'iron_worker'

const PAYLOAD = iron_worker.params()

principessa().execute({
  payload: PAYLOAD,
  onRun(options) {
    // run your service with options
    // this should return an promise that resolves when the service is done
    return myService(options)
  },
  onError(errors) {
    // errors is an Array of errors that occurred
  },
  onComplete() {
    // this is called once your service completed running
  }
})
```

### Initialization

Principessa currently exposes a function, which returns an object (the public API) with currently only one public method `execute`.  
The function that is exposed currently takes no arguments, but may later accept some custom configuration.  
The `execute` method accepts on parameter, which configures principessa for this specific execution of your service:
- `payload`: the payload corresponds to the input that your service should get. If your input contains any files that need to be downloaded first, you need to indicate them separately. [See here](#payload) for how the payload should be structured.
- `onRun(options)`: this function will be called when principessa is done preparing your options. It will extend the `options` you specified in the payload with the resolved `assets`'s paths, so your service is good to go with local assets.
- `onError(errors)`: callback function that will be called with an array of errors that occurred during payload validation or execution of your service
- `onComplete()`: callback function that will be called once your service is done processing. (Later there will be support for automatically calling a custom url with the output of your service.)

#### <a name="payload"></a> Payload format

The payload must conform with this [JSON schema](http://json-schema.org/):
```json
  {
    "type": "object",
    "properties": {
      "storageProvider": {
        "enum": ["s3"]
      },
      "storageProviderConfig": {
        "type": "object"
      },
      "assets": {
        "type": "object",
        "patternProperties": {
          ".*": {
            "type": "string"
          }
        }
      },
      "options": {
        "type": "object"
      }
    },
    "required": ["options"],
    "additionalProperties": false
  }
```
Example:
```json
{
  "storageProvider": "s3",
  "storageProviderConfig": {
    "bucket": "bucket-with-files"
  },
  "assets": {
    "inputFile1": "my-input-file.json"
  },
  "options": {
    "serviceSpecificOption123": true,
    "continueOnProblems": false
  }
}
```
If you configured the storage provider correctly, your `onRun` method will get called with the following `options`:
```js
{
  serviceSpecificOption123: true,
  continueOnProblems: false,
  inputFile1: '/localWorkerDir/my-input-file.json'
}
```

#### Supported storage providers

At the moment we only support [Amazon S3](https://aws.amazon.com/s3/). If you want to use it you have to configure it in the `payload`. You simply set the `storageProvider` option to `s3` and provide an s3 bucket, where principessa should look for your assets.  
Example:
```json
{
  "storageProvider": "s3",
  "storageProviderConfig": {
    "bucket": "bucket-with-assets"
  }
}
```
