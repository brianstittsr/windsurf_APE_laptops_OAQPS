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
const SETTINGS_FILE_KEY = 'settings.json';

router.get('/', async (req, res) => {
  const s3 = getS3Client();
  if (!s3) {
    return res.status(500).json({ error: 'S3 service is not configured.' });
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: SETTINGS_FILE_KEY,
  };

  try {
    const data = await s3.getObject(params).promise();
    res.json(JSON.parse(data.Body.toString('utf-8')));
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      res.json({}); // Return empty object if settings file doesn't exist
    } else {
      console.error('Error fetching settings from S3:', error);
      res.status(500).json({ error: 'Failed to fetch settings from S3.' });
    }
  }
});

router.post('/', async (req, res) => {
  const s3 = getS3Client();
  if (!s3) {
    return res.status(500).json({ error: 'S3 service is not configured.' });
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: SETTINGS_FILE_KEY,
    Body: JSON.stringify(req.body, null, 2),
    ContentType: 'application/json',
  };

  try {
    await s3.putObject(params).promise();
    res.json({ success: true, message: 'Settings saved to S3.' });
  } catch (error) {
    console.error('Error saving settings to S3:', error);
    res.status(500).json({ error: 'Failed to save settings to S3.' });
  }
});

module.exports = router;
