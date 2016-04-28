import test from 'ava'
import stream from 'stream'
import path from 'path'
import { unlinkSync, writeFileSync } from 'fs'
import aws, {
  __RewireAPI__ as awsRewireApi,
} from '../../src/storage-providers/aws.js'
import sinon from 'sinon'

/* eslint-disable no-param-reassign, no-underscore-dangle */
test.beforeEach(t => {
  t.context.s3uploadMock = sinon.spy((conf, callback) => {
    callback(null, {})
  })
  awsRewireApi.__Rewire__('AWS', {
    S3: () => ({
      getObject: () => ({
        createReadStream: () => {
          const readStream = new stream.Readable
          readStream.push(null)
          return readStream
        },
      }),
      upload: t.context.s3uploadMock,
    }),
  })
})
test.afterEach(t => {
  t.context.s3uploadMock.reset()
})
/* eslint-enable no-param-reassign, no-underscore-dangle */

test('should expose a function that returns an object with a download method',
t => {
  const provider = aws()
  t.is(typeof provider, 'object')
  t.is(typeof provider.download, 'function')
})

test('download - should download the given file from the configured bucket',
t => {
  const downloadFolder = path.join(__dirname, '../../')
  const provider = aws({
    bucket: 'test',
    downloadFolder,
  })
  return provider.download('test.csv').then(localPath => {
    t.is(localPath, path.join(downloadFolder, 'test.csv'))
    unlinkSync(path.join(downloadFolder, 'test.csv'))
  })
})

test('upload - should upload the given file to the configured bucket',
t => {
  const file = path.join(__dirname, '../../', 'message.txt')
  writeFileSync(file, 'Hello Node.js', 'utf8')
  const provider = aws({ bucket: 'test' })
  return provider.upload(file).then((response) => {
    t.is(t.context.s3uploadMock.calledOnce, true)
    t.is(t.context.s3uploadMock.firstCall.args[0].Bucket, 'test')
    t.is(t.context.s3uploadMock.firstCall.args[0].Key, file)
    t.deepEqual(response, {})
  })
})

test('upload - should reject for erroneous uploads',
t => {
  const s3uploadMock = sinon.spy((conf, callback) => {
    callback(new Error(), {})
  })
  /* eslint-disable no-underscore-dangle */
  awsRewireApi.__Rewire__('AWS', {
    S3: () => ({
      upload: s3uploadMock,
    }),
  })
  /* eslint-ensable no-underscore-dangle */
  const file = path.join(__dirname, '../../', 'message.txt')
  writeFileSync(file, 'Hello Node.js', 'utf8')
  const provider = aws({ bucket: 'test' })
  return provider.upload(file).catch(({ err, data }) => {
    t.is(s3uploadMock.calledOnce, true)
    t.is(s3uploadMock.firstCall.args[0].Bucket, 'test')
    t.is(s3uploadMock.firstCall.args[0].Key, file)
    t.is(err instanceof Error, true)
    t.deepEqual(data, {})
  })
})
