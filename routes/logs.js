const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

const getS3Client = () => {
  if (!process.env.VCAP_SERVICES) {
    console.error('VCAP_SERVICES not found. S3 functionality is disabled.');
    return null;
  }

  const vcap = JSON.parse(process.env.VCAP_SERVICES);
  const s3Credentials = vcap.s3[0].credentials;

  return new AWS.S3({
    accessKeyId: s3Credentials.access_key_id,
    secretAccessKey: s3Credentials.secret_access_key,
    region: s3Credentials.region,
    endpoint: `https://${s3Credentials.hostname}`,
  });
};

const BUCKET_NAME = JSON.parse(process.env.VCAP_SERVICES || '{}').s3?.[0]?.credentials?.bucket;

router.post('/chat', async (req, res) => {
  const s3 = getS3Client();
  if (!s3) {
    return res.status(500).json({ error: 'S3 service is not configured.' });
  }

  const { page, date, messages } = req.body;
  const logFileKey = `chat_logs/${page}_${date.split('T')[0]}.json`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: logFileKey,
    Body: JSON.stringify({ page, date, messages }, null, 2),
    ContentType: 'application/json',
  };

  try {
    await s3.putObject(params).promise();
    res.json({ success: true, message: `Chat log saved to ${logFileKey}` });
  } catch (error) {
    console.error('Error saving chat log to S3:', error);
    res.status(500).json({ error: 'Failed to save chat log to S3.' });
  }
});

module.exports = router;
