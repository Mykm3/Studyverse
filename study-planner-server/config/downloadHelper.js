const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloudinary = require('./cloudinary');

/**
 * Downloads a file from Cloudinary to the local file system
 * @param {string} publicId - The Cloudinary public ID of the file
 * @param {string} originalFilename - The original file name (used for the local file name)
 * @param {string} resourceType - The Cloudinary resource type (image, video, raw)
 * @returns {Promise<string>} - Promise resolving to the local file path
 */
async function downloadFromCloudinary(publicId, originalFilename, resourceType = 'auto') {
  try {
    console.log(`[Download] Downloading file from Cloudinary: ${publicId}`);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate a Cloudinary URL for direct download
    const cloudinaryUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: 'upload'
    });
    
    console.log(`[Download] Generated Cloudinary URL: ${cloudinaryUrl}`);
    
    // Determine local file path
    const fileExtension = path.extname(originalFilename) || '.pdf';
    const filename = `${publicId.replace(/\//g, '-')}${fileExtension}`;
    const localFilePath = path.join(uploadsDir, filename);
    
    // Download the file if it doesn't exist locally
    if (!fs.existsSync(localFilePath)) {
      console.log(`[Download] Downloading to local path: ${localFilePath}`);
      
      const response = await axios({
        method: 'GET',
        url: cloudinaryUrl,
        responseType: 'stream'
      });
      
      // Save the file
      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`[Download] File successfully downloaded to: ${localFilePath}`);
    } else {
      console.log(`[Download] File already exists locally at: ${localFilePath}`);
    }
    
    // Return the URL path that can be accessed from the client
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('[Download] Error downloading file from Cloudinary:', error);
    throw error;
  }
}

/**
 * Ensures a Cloudinary URL has proper parameters for PDF viewing
 * @param {string} url The original Cloudinary URL
 * @returns {string} URL with proper parameters for viewing
 */
function ensureInlineViewing(url) {
  if (!url) return url;
  
  // Check if this is a Cloudinary URL
  if (!url.includes('cloudinary.com')) return url;
  
  // Check if this is likely a PDF
  const isProbablyPdf = url.toLowerCase().endsWith('.pdf') || 
                        url.includes('/pdf') || 
                        url.includes('/raw/');
                        
  if (!isProbablyPdf) return url;
  
  // For PDFs, we want to use the direct delivery URL
  const cloudName = cloudinary.config().cloud_name;
  const publicId = url.split('/').pop().split('.')[0]; // Extract public ID
  const format = url.split('.').pop().toLowerCase();
  
  // Construct a direct delivery URL for PDFs without any transformation flags
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.${format}`;
}

module.exports = {
  downloadFromCloudinary,
  ensureInlineViewing
}; 