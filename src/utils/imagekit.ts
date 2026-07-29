export const uploadVideoToImageKit = async (file: File): Promise<string> => {
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error('ImageKit environment variables are missing.');
  }

  // 1. Generate token and expire
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 mins

  // 2. Create signature
  const cryptoStr = token + expire;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(privateKey);
  const msgData = encoder.encode(cryptoStr);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 3. Prepare FormData
  let fileName = file.name;
  if (!fileName.includes('.')) {
    // Mobile browsers often capture video without an extension.
    const ext = file.type.split('/')[1] || 'mp4';
    fileName = `${fileName}.${ext}`;
  }

  // Convert file to Base64 to prevent binary corruption on mobile browsers
  const base64Str = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

  const formData = new FormData();
  formData.append('file', base64Str);
  formData.append('fileName', fileName);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('expire', expire.toString());
  formData.append('token', token);
  formData.append('folder', '/property_videos');

  // 4. Upload to ImageKit API
  try {
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload video to ImageKit');
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    throw new Error(error.message || 'Error uploading video');
  }
};
