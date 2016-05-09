import AWS from 'aws-sdk'
import path from 'path'
import cuid from 'cuid'
import { createWriteStream, createReadStream } from 'fs'
import temp from 'temp'

// Automatically track and cleanup files at exit
temp.track()

/*
 * this requires AWS credentials being set in the environment
 * AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */
export default (config = {}) => {
  const { bucket: Bucket, awsConfig } = config
  let { downloadFolder } = config
  if (!downloadFolder) {
    downloadFolder = temp.mkdirSync()
  }
  const s3 = new AWS.S3(Object.assign({}, awsConfig, { signatureVersion: 'v4' }))
  return {
    download(file) {
      return new Promise((resolve, reject) => {
        const localPath = path.join(downloadFolder, path.basename(file))
        const localFile = createWriteStream(localPath)
        s3.getObject({ Bucket, Key: file })
        .createReadStream()
        .pipe(localFile)
        .on('finish', () => {
          resolve(localPath)
        })
        .on('error', reject)
      })
    },
    upload(file, _fileName) {
      let fileName = _fileName
      if (!fileName) {
        fileName = path.basename(file)
      }
      return new Promise((resolve, reject) => {
        const fileStream = createReadStream(file)
        s3.upload({ Bucket, Key: path.join(cuid(), fileName), Body: fileStream }, (err, data) => {
          if (err) {
            reject({ err, data })
          } else {
            resolve(data.key)
          }
        })
      })
    },
    delete(file) {
      return new Promise((resolve, reject) => {
        s3.deleteObject({ Bucket, Key: file }, (err, data) => {
          if (err) {
            reject({ err, data })
          } else {
            resolve(data)
          }
        })
      })
    },
  }
}
