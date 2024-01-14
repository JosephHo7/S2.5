const sharp = require('sharp');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Get the S3 bucket and object key from the event
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    // Check if the object key has the expected prefix
    if (!key.startsWith('original-images/')) {
      console.log('Ignoring object with incorrect prefix:', key);
      return {
        statusCode: 200,
        body: JSON.stringify('Object does not have the correct prefix, ignoring.'),
      };
    }

    // Download the image from S3
    const params = { Bucket: bucket, Key: key };
    const originalImage = await s3.getObject(params).promise();

    // Resize the image using sharp
    const resizedImageBuffer = await sharp(originalImage.Body)
      .resize({ width: 300, height: 200 }) // Set your desired width and height
      .toBuffer();

    // Upload the resized image back to S3 with a different prefix
    const resizedKey = `resized-images/${key.replace('original-images/', '')}`;
    const uploadParams = {
      Bucket: bucket,
      Key: resizedKey,
      Body: resizedImageBuffer,
    };

    await s3.upload(uploadParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify('Image resized and uploaded successfully'),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error resizing and uploading image'),
    };
  }
};