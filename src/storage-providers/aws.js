import AWS from 'aws-sdk'
import path from 'path'
import { createWriteStream } from 'fs'

/*
 * this requires AWS credentials being set in the environment
 * AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
 */
export default (config = {}) => {
  const { bucket: Bucket, downloadFolder } = config
  const s3 = new AWS.S3()
  return {
    download(file) {
      return new Promise((resolve, reject) => {
        const localPath = path.join(downloadFolder, file)
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
  }
}
