import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.REACT_APP_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY as string,
  },
});

export const generateUniqueFileName = (file: File) => {
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  return filename;
};

export const createParams = (file: File) => {
  const fileName = generateUniqueFileName(file);
  return {
    Bucket: process.env.REACT_APP_AWS_BUCKET_NAME as string,
    Key: fileName,
    Body: file,
    ContentType: file.type,
  };
};

export const filePath = (fileName: string) =>
  `https://punch-sales-app.s3.amazonaws.com/${fileName}`;
