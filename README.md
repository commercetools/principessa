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

### Documentation

Principessa currently exposes a function, which returns an object (the public API) with currently only one public method `execute`.  
The function that is exposed currently takes no arguments, but may later accept some custom configuration.  
The `execute` method accepts on parameter, which configures principessa for this specific execution of your service:
- `payload`: the payload corresponds to the input that your service should get. If your input contains any files that need to be downloaded first, you need to indicate them separately. [See here](#payload) for how the payload should be structured.
- `onRun(options)`: this function will be called when principessa is done preparing your options. It will extend the `options` you specified in the payload with the resolved `assets`'s paths, so your service is good to go with local assets.
- `onError(errors)`: callback function that will be called with an array of errors that occurred during payload validation or execution of your service
- `onComplete()`: callback function that will be called once your service is done processing. You can optionally return an object, that will be appended to the [callback payload](#callback)

### <a name="payload"></a> Payload format

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
    },
    "output": {
      "type": "object"
    },
    "callbackUrl": {
      "type": "string"
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
    "Bucket": "bucket-with-files"
  },
  "assets": {
    "inputFile1": "my-input-file.json"
  },
  "options": {
    "serviceSpecificOption123": true,
    "continueOnProblems": false,
    "outputFolder": "/output"
  },
  "output": {
    "transformedFile": "/output/my-output-file.json"
  },
  "callbackUrl": "http://scheduler.commercetools.io/${taskId}/done"
}
```
#### Assets

In the assets section you should list all files that are needed as Input for your service.
Every asset will be downloaded from the configured storage provider, and stored locally. Then the asset will be appended to the options object, by using the key and the resolved path of the asset.
Example:
```js
{
  storageProvider: "s3",
  storageProviderConfig: {
    Bucket: 'your-amazon-s3-bucket'
  },
  options: {
    someOption: true
  },
  assets: {
    inputFile: 'products.csv'
  }
}
```
The `onRun` method would then be called with the following options, which are ready to be used by your service.
```js
{
  someOptions: true,
  inputFile: '/localWorkerDir/products.csv'
}
```

#### Options

The options object is basically a pass-through for your service. You can put any kind of input that your worker needs here.

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
Also you need to put store your credentials in environment variables:
```sh
export AWS_ACCESS_KEY_ID=***
export AWS_SECRET_ACCESS_KEY=***
```

#### <a name="callback"></a> Output and callbackUrl

If your service produces files as output, you can list these in the output object.
They will then be uploaded to your configured storage provider, and passed to the callbackUrl in a POST request.
Example: You have a product export service, that produces a csv file, named 'products.csv', and puts it in the `/output` folder. The following configuration would pick this file up, upload it to S3 and call the callbackUrl with a reference to the file:
```js
{
  "storageProvider": "s3",
  "storageProviderConfig": {
    "bucket": "bucket-with-assets"
  },
  options: {
    outputFolder: '/output'
  },
  output: {
    productsFile: 'products.csv'
  },
  callbackUrl: 'http://scheduler.commercetoools.io/jobs/<job-id>/done'
}
```
This would result in a POST request like this:
```bash
curl
  -H "Content-Type: application/json"
  -X POST -d '{
    "productsFile":"http://aws.amazon.com/2c4950gu8n94gmx2495cm.csv"
  }'
  http://scheduler.commercetoools.io/jobs/<job-id>/done
```
