const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-north-1' });

const sendEmail = (emailTo, message) => {
  const params = {
    Destination: {
      ToAddresses: [emailTo],
    },
    Message: {
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: message,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Uusi salasana linkki',
      },
    },
    Source: 'ohjelmistotuotanto2@gmail.com',
  };

  return new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
};

module.exports = sendEmail;
