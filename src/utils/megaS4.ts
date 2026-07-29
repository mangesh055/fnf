import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const uploadVideoToMega = async (file: File): Promise<string> => {
  const endpoint = import.meta.env.VITE_MEGA_S4_ENDPOINT;
  const accessKeyId = import.meta.env.VITE_MEGA_S4_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_MEGA_S4_SECRET_ACCESS_KEY;
  const bucketName = import.meta.env.VITE_MEGA_S4_BUCKET_NAME;
  const publicUrl = import.meta.env.VITE_MEGA_S4_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error('MEGA S4 environment variables are missing.');
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Ensure unique filename
  const fileExt = file.name.split('.').pop() || 'mp4';
  const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file,
      ContentType: file.type || 'video/mp4',
    });

    await s3.send(command);

    // Return the public URL to access the uploaded file
    return `${publicUrl.replace(/\/$/, '')}/${fileName}`;
  } catch (error: any) {
    console.error('MEGA S4 upload error:', error);
    throw new Error(error.message || 'Error uploading video to MEGA S4');
  }
};
