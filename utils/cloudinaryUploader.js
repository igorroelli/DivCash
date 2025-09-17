import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const uploadImageToCloudinary = async (uri) => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Credenciais do Cloudinary não encontradas ou não configuradas no .env");
  }

  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    type: `image/jpeg`,
    name: `${uuidv4()}.jpg`,
  });
  formData.append('upload_preset', uploadPreset);
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || "Falha no upload para o Cloudinary");
    }
  } catch (error) {
    console.error("Erro CRÍTICO no upload:", error);
    throw error;
  }
};