const AWS = require('aws-sdk');
const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_BUCKET_IAM_ACCESS_KEY,
  secretAccessKey: process.env.AWS_BUCKET_IAM_PRIVATE_KEY,
  region: 'eu-north-1',
});

module.exports = { s3Client };

//upload file to s3

//download a file from s3
