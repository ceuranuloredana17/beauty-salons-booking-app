import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';


const createMetadata = (file) => ({
  contentType: file.type,
  customMetadata: {
    'Access-Control-Allow-Origin': '*',
  }
});

/**
 * Upload a file to Firebase Storage using the Firebase SDK
 * 
 * @param {File} file - The file to upload
 * @param {string} path - The path in Firebase storage (e.g., 'services/salon/123/image.jpg')
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadFile = async (file, path) => {
  try {
    
    const storageRef = ref(storage, path);
    
  
    const snapshot = await uploadBytes(storageRef, file);
    
   
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('File uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Direct upload to Firebase Storage using fetch
 * This is a fallback method if the Firebase SDK method fails
 * 
 * @param {File} file - The file to upload
 * @param {string} path - The path in Firebase storage (e.g., 'services/salon/123/image.jpg')
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const directUpload = async (file, path) => {
  try {
    // Firebase Storage endpoint
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o`;
    
   
    const formData = new FormData();
    formData.append('file', file);
    
    
    const encodedPath = encodeURIComponent(path);
    
   
    const response = await fetch(`${baseUrl}?name=${encodedPath}`, {
      method: 'POST',
      body: formData,
      headers: {
      
      },
    });
    
    if (!response.ok) {
      throw new Error(`Firebase direct upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    

    const downloadURL = `${baseUrl}/${encodedPath}?alt=media&token=${data.downloadTokens}`;
    
    return downloadURL;
  } catch (error) {
    console.error('Direct upload error:', error);
    throw error;
  }
};

/**
 * Upload a file through the server to avoid CORS issues
 * This is a second fallback if both direct methods fail
 * 
 * @param {File} file - The file to upload
 * @param {string} path - The path (used for file naming)
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const proxyUpload = async (file, path) => {
  try {
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    const token = localStorage.getItem("token")
    // Upload through our server proxy
    const response = await fetch('http://localhost:8080/api/upload', {
      "Authorization" : `Bearer ${token}`,
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Server proxy upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Proxy upload error:', error);
    throw error;
  }
};

/**
 * Multi-method upload that tries all available methods in sequence
 * 
 * @param {File} file - The file to upload
 * @param {string} path - The path for storage
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadWithFallback = async (file, path) => {
  try {
    
    console.log('Trying server proxy upload first...');
    return await proxyUpload(file, path);
  } catch (proxyError) {
    console.warn('Server proxy upload failed, trying Firebase SDK:', proxyError);
    
    try {
      
      return await uploadFile(file, path);
    } catch (error) {
      console.warn('Firebase SDK upload failed, trying direct upload:', error);
      
      try {
      
        return await directUpload(file, path);
      } catch (directError) {
        console.error('All upload methods failed:', directError);
        throw new Error('Failed to upload file after trying all methods');
      }
    }
  }
};

export { createMetadata }; 