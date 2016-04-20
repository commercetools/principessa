import test from 'ava'
import stream from 'stream'
import path from 'path'
import { unlinkSync } from 'fs'
import aws, {
  __RewireAPI__ as awsRewireApi,
} from '../../src/storage-providers/aws.js'

awsRewireApi.__Rewire__('AWS', {
  S3: () => ({
    getObject: () => ({
      createReadStream: () => {
        const readStream = new stream.Readable
        readStream.push(null)
        return readStream
      },
    }),
  }),
})

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
    Bucket: 'test',
    downloadFolder,
  })
  return provider.download('test.csv').then(localPath => {
    t.is(localPath, path.join(downloadFolder, 'test.csv'))
    unlinkSync(path.join(downloadFolder, 'test.csv'))
  })
})
