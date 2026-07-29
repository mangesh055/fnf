export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET) are missing.');
  }

  // For files larger than 5MB, we must use Cloudinary's chunked upload API
  // because unsigned standard uploads have a hard 10MB limit.
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  if (file.size > chunkSize) {
    return await uploadChunkedToCloudinary(file, cloudName, uploadPreset, chunkSize);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  
  // Auto-convert images to JPEG for better browser compatibility
  // This handles HEIC, WEBP, and other formats from phones
  if (resourceType === 'image') {
    formData.append('fetch_format', 'auto');
    formData.append('quality', 'auto');
    formData.append('flags', 'immutable_cache');
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload file to Cloudinary');
    }

    const data = await response.json();
    // Add format conversion to URL - force JPEG format for maximum compatibility
    let url = data.secure_url;
    if (resourceType === 'image') {
      url = url.replace('/upload/', '/upload/f_jpg,q_auto/');
    }
    return url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Error uploading file');
  }
};

const uploadChunkedToCloudinary = async (file: File, cloudName: string, uploadPreset: string, chunkSize: number): Promise<string> => {
  const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const totalChunks = Math.ceil(file.size / chunkSize);
  let finalUrl = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    // Pass the original file name so Cloudinary knows the correct extension for the chunk!
    formData.append('file', chunk, file.name);
    formData.append('upload_preset', uploadPreset);
    
    // Cloudinary requires the cloud name in this specific param for chunked unsigned uploads
    formData.append('cloud_name', cloudName); 

    const contentRange = `bytes ${start}-${end - 1}/${file.size}`;

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      headers: {
        'X-Unique-Upload-Id': uniqueUploadId,
        'Content-Range': contentRange,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload chunk to Cloudinary');
    }

    const data = await response.json();
    if (i === totalChunks - 1) {
      finalUrl = data.secure_url;
    }
  }

  return finalUrl;
};
