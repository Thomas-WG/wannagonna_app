import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from 'firebaseConfig';

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param {File} file - The file to upload
 * @param {string} path - The path in storage where the file should be uploaded
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export const uploadFile = async (file, path) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Set custom metadata to handle CORS
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'Access-Control-Allow-Origin': '*'
      }
    };
    
    // Upload the file with metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Uploads a profile picture to Firebase Storage
 * @param {File} file - The profile picture file
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - The download URL of the uploaded profile picture
 */
export const uploadProfilePicture = async (file, userId) => {
  if (!file || !userId) {
    throw new Error('File and userId are required');
  }

  // Create a path for the profile picture in the members folder
  const path = `members/${userId}`;
  return uploadFile(file, path);
}; 