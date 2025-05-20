const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Log Cloudinary configuration
console.log('[Upload] Cloudinary configuration:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing',
  apiKey: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
  apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'studyverse_notes',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mp3', 'wav'],
    type: 'upload',
    transformation: []
  }
});

// Create the basic multer middleware
const multerUpload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Function to create a configured upload middleware
// with proper error handling and logging
const upload = (fieldName) => {
  if (!fieldName) {
    throw new Error('Field name is required for file upload');
  }
  
  // Return middleware function
  return (req, res, next) => {
    console.log('[Upload] Starting file upload process:', {
      fieldName,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
    
    // Use multer's single file upload
    multerUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        console.error('[Upload] File upload error:', {
          message: err.message,
          stack: err.stack,
          field: fieldName,
          code: err.code,
          name: err.name,
          http_code: err.http_code
        });

        // Handle specific multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File size too large. Maximum size is 10MB.' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            error: 'Too many files. Only one file can be uploaded at a time.' 
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            error: `Invalid field name. Expected '${fieldName}'` 
          });
        }
        
        // Handle Cloudinary-specific errors
        if (err.message && err.message.includes('file format not allowed')) {
          return res.status(400).json({
            error: 'File format not supported by the storage provider. Please try a different file format.'
          });
        }

        // Check for Cloudinary API errors
        if (err.http_code === 400 || err.http_code === 401 || err.http_code === 403) {
          return res.status(500).json({
            error: 'Cloudinary configuration error. Please check your API credentials and settings.'
          });
        }

        // Generic error fallback
        return res.status(500).json({
          error: 'File upload failed: ' + (err.message || 'Unknown error')
        });
      }
      
      // Log successful upload if file exists
      if (req.file) {
        console.log('[Upload] File successfully uploaded to Cloudinary:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          publicId: req.file.filename,
          url: req.file.path, // This is the Cloudinary URL
          secureUrl: req.file.path.replace('http://', 'https://') // Ensure HTTPS
        });

        // Verify the Cloudinary URL is accessible
        if (!req.file.path) {
          console.error('[Upload] Cloudinary URL is missing from upload response');
          return res.status(500).json({ 
            error: 'Failed to get file URL from Cloudinary' 
          });
        }
      } else {
        console.log('[Upload] No file was uploaded with field:', fieldName);
      }
      
      next();
    });
  };
};

module.exports = upload; 