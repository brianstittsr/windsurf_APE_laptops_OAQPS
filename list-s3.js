const AWS = require('aws-sdk');
const { execSync } = require('child_process');

const getS3Client = () => {
  try {
    const vcapServices = execSync('.\\cf-cli-temp\\cf.exe env epa-oid-analytics --organization epa-prototyping --space admin-training | findstr VCAP_SERVICES').toString();
    const vcapJson = vcapServices.substring(vcapServices.indexOf('{'));
    const vcap = JSON.parse(vcapJson);
    const s3Credentials = vcap.VCAP_SERVICES.s3[0].credentials;

    return new AWS.S3({
      accessKeyId: s3Credentials.access_key_id,
      secretAccessKey: s3Credentials.secret_access_key,
      region: s3Credentials.region,
      endpoint: `https://${s3Credentials.hostname}`,
    });
  } catch (error) {
    console.error('Failed to get S3 credentials. Make sure you are logged in to Cloud.gov and the app is running.');
    return null;
  }
};

const listFiles = async () => {
  const s3 = getS3Client();
  if (!s3) return;

  const bucketName = JSON.parse(execSync('.\\cf-cli-temp\\cf.exe env epa-oid-analytics --organization epa-prototyping --space admin-training | findstr VCAP_SERVICES').toString().substring(execSync('.\\cf-cli-temp\\cf.exe env epa-oid-analytics --organization epa-prototyping --space admin-training | findstr VCAP_SERVICES').toString().indexOf('{'))).VCAP_SERVICES.s3[0].credentials.bucket;

  const params = {
    Bucket: bucketName,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    console.log('Files in S3 bucket:', data.Contents.map(file => file.Key));
  } catch (error) {
    console.error('Error listing files in S3:', error);
  }
};

listFiles();
