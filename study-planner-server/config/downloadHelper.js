const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloudinary = require('./cloudinary');

/**
 * Ensures a URL is suitable for inline viewing in a browser
 * @param {string} url - The URL to process
 * @returns {string} - URL formatted for inline viewing
 */
const ensureInlineViewing = (url) => {
  if (!url) return url;
  
  try {
    // Remove any attachment flags that force download
    if (url.includes('/upload/fl_attachment/')) {
      url = url.replace('/upload/fl_attachment/', '/upload/');
    }
    
    // Ensure HTTPS
    url = url.replace('http://', 'https://');
    
    return url;
  } catch (err) {
    console.error('[DownloadHelper] Error processing URL for inline viewing:', err);
    return url;
  }
};

/**
 * Downloads a file from Cloudinary and saves it locally
 * @param {string} publicId - Cloudinary public ID
 * @param {string} filename - Desired filename
 * @param {string} resourceType - Resource type (raw, image, video)
 * @returns {Promise<string>} - Path to the downloaded file
 */
const downloadFromCloudinary = async (publicId, filename = 'document.pdf', resourceType = 'raw') => {
  console.log(`[DownloadHelper] Downloading file from Cloudinary: ${publicId}`);
  
  try {
    // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
    let cleanPublicId = publicId;
    
    // Remove file extension if present in the publicId
    if (cleanPublicId.includes('.')) {
      cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
    }
    
    // Get file extension from filename or default to pdf
    let extension = 'pdf';
    if (filename && filename.includes('.')) {
      extension = filename.split('.').pop().toLowerCase();
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create a safe filename
    const safeFilename = `${cleanPublicId.replace(/\//g, '-')}.${extension}`;
    const localFilePath = path.join(uploadsDir, safeFilename);
    
    // Check if file already exists locally
    if (fs.existsSync(localFilePath)) {
      console.log(`[DownloadHelper] File already exists locally: ${localFilePath}`);
      return `/uploads/${safeFilename}`;
    }
    
    // Generate the Cloudinary URL
    const cloudName = cloudinary.config().cloud_name;
    const cloudinaryUrl = ensureInlineViewing(`https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}.${extension}`);
    
    console.log(`[DownloadHelper] Downloading from URL: ${cloudinaryUrl}`);
    
    // Download the file
    const response = await axios({
      method: 'GET',
      url: cloudinaryUrl,
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Study-Planner-Server'
      }
    });
    
    // Save to local file
    fs.writeFileSync(localFilePath, response.data);
    console.log(`[DownloadHelper] File saved to: ${localFilePath}`);
    
    // Return the relative path
    return `/uploads/${safeFilename}`;
  } catch (error) {
    console.error('[DownloadHelper] Error downloading file:', error);
    throw error;
  }
};

/**
 * Adds authentication token to a URL if needed
 * @param {string} url - The URL to process
 * @param {string} token - Authentication token
 * @returns {string} - URL with authentication token
 */
const addAuthToUrl = (url, token) => {
  if (!url || !token) return url;
  
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('token')) {
      urlObj.searchParams.append('token', token);
    }
    return urlObj.toString();
  } catch (err) {
    console.error('[DownloadHelper] Error adding token to URL:', err);
    return url;
  }
};

module.exports = {
  downloadFromCloudinary,
  ensureInlineViewing,
  addAuthToUrl
}; 