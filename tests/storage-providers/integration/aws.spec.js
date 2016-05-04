import test from 'ava'
import path from 'path'
import aws from '../../../src/storage-providers/aws.js'
import tempWrite from 'temp-write'
import temp from 'temp'
import { s3 } from '../../../credentials.js'
import cuid from 'cuid'

// Automatically track and cleanup files at exit
temp.track()

// we need to manually load the s3 credentials and pass them to the s3 constructor
// since AVA runs tests in a seperate process, that is environment agnostic
const getConfig = (c) =>
  Object.assign({}, { awsConfig: s3 }, { bucket: 'ctp-principessa' }, c)

test('upload - should upload the given file to the configured bucket',
t => {
  // we use cuid so to generate unique file names, so we can run tests in parallel
  const fileName = `${cuid()}.txt`
  const file = tempWrite.sync('Hello Node.js', fileName)
  const provider = aws(getConfig())
  return provider.upload(file, fileName)
    .then((response) => {
      t.is(typeof response, 'string')
    }).then(() => provider.delete(fileName))
})

test('download - should download the given file from the configured bucket',
t => {
  const fileName = `${cuid()}.txt`
  const downloadFolder = temp.mkdirSync()
  const provider = aws(getConfig({ downloadFolder }))
  const file = tempWrite.sync('Hello Node.js', fileName)
  return provider.upload(file, fileName)
    .then(() =>
      provider.download(fileName).then(localPath => {
        t.is(localPath, path.join(downloadFolder, fileName))
      })
    ).then(() => provider.delete(fileName))
})

test('delete - should delete the given file from the configured bucket',
t => {
  const fileName = `${cuid()}.txt`
  const downloadFolder = temp.mkdirSync()
  const provider = aws(getConfig({ downloadFolder }))
  const file = tempWrite.sync('Hello Node.js', fileName)
  return provider.upload(file, fileName)
    .then(() =>
      provider.delete(fileName).then(res => {
        t.deepEqual(res, {})
      })
    ).then(() => provider.delete(fileName))
})
