const AWS = require('aws-sdk');
const fs = require('fs');
const util = require('util');
const unlink = util.promisify(fs.unlink);

const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_BUCKET_IAM_ACCESS_KEY,
  secretAccessKey: process.env.AWS_BUCKET_IAM_PRIVATE_KEY,
  region: 'eu-north-1',
});

//upload file to s3

//Herokussa ei voi käyttää tätä, localina toimii

const upload = async (file) => {
  try {
    const fileStream = fs.createReadStream(file.path);
    fileStream.on('error', function () {
      console.log(file.path);
      res.status(404).end();
    });

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileStream,
      Key: file.filename,
    };
    await unlink(file.path);
    return s3Client.upload(params).promise();
  } catch (error) {
    console.error(error);
  }
};

//download a file from s3

const getFileStream = (fileKey, res) => {
  const downLoadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };
  const readStream = s3Client.getObject(downLoadParams).createReadStream();

  readStream.on('error', function () {
    res.status(404).end();
  });

  readStream.pipe(res);
};

//delete img from s3
const deleteFile = (keys) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys,
    },
  };
  return s3Client.deleteObjects(params).promise();
};

module.exports = { deleteFile, upload, getFileStream, s3Client };
