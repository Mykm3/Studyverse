const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Log Cloudinary configuration
console.log('[Upload] Cloudinary configuration:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing',
  apiKey: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
  apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
});

// Function to determine resource type based on file mimetype/extension
const determineResourceType = (req, file) => {
  const filename = file.originalname.toLowerCase();
  
  // List of formats that should use 'raw' resource_type
  const rawFormats = [
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
    '.txt', '.csv', '.json', '.xml', '.zip', '.rar'
  ];
  
  // Check if the file extension indicates it should be a raw file
  const shouldBeRaw = rawFormats.some(format => filename.endsWith(format));

  // Office documents and binary files should use 'raw' resource_type
  if (shouldBeRaw || 
      file.mimetype.includes('officedocument') ||
      file.mimetype.includes('msword') ||
      file.mimetype.includes('ms-excel') ||
      file.mimetype.includes('ms-powerpoint')) {
    console.log(`[Upload] Using 'raw' resource type for file: ${filename}`);
    return 'raw';
  }
  
  // PDF files can use 'image' resource type with the PDF extension
  if (file.mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    console.log(`[Upload] Using 'image' resource type for PDF: ${filename}`);
    return 'image';
  }
  
  // Audio/video files use 'video' resource type
  if (file.mimetype.includes('audio') || file.mimetype.includes('video')) {
    console.log(`[Upload] Using 'video' resource type for media: ${filename}`);
    return 'video';
  }
  
  // Default to auto for everything else
  console.log(`[Upload] Using 'auto' resource type for: ${filename}`);
  return 'auto';
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const resourceType = determineResourceType(req, file);
    console.log(`[Upload] Preparing Cloudinary storage with resource_type: ${resourceType} for file: ${file.originalname}`);
    
    // Different allowed formats based on resource type
    let allowed_formats;
    
    // For raw files, don't specify allowed_formats, as Cloudinary handles raw files differently
    if (resourceType === 'raw') {
      return {
        folder: 'studyverse_notes',
        resource_type: resourceType,
        // For raw files, don't restrict formats to avoid Cloudinary validation issues
        // This will let Cloudinary handle the raw file format detection
        transformation: [{ quality: 'auto' }]
      };
    } else {
      // For non-raw resources, specify the allowed formats
      allowed_formats = [
        // Document formats
        'pdf', 
        // Text formats
        'txt', 'md', 'csv', 'json', 'xml',
        // Media formats
        'mp3', 'mp4', 'wav', 'ogg', 'webm',
        // Image formats
        'jpg', 'jpeg', 'png', 'gif', 'svg',
      ];
      
      return {
        folder: 'studyverse_notes',
        resource_type: resourceType,
        allowed_formats,
        transformation: [{ quality: 'auto' }]
      };
    }
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