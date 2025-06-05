const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary storage
const configureStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `study-planner/${folderName}`,
      resource_type: 'auto',
      // For PDFs, ensure they're uploaded with proper flags for viewing
      format: (req, file) => {
        // Get file extension
        const extension = path.extname(file.originalname).toLowerCase().substring(1);
        console.log(`[Upload] File extension: ${extension} for file ${file.originalname}`);
        return extension;
      },
      transformation: (req, file) => {
        // For PDFs, don't apply any transformations
        const extension = path.extname(file.originalname).toLowerCase();
        if (extension === '.pdf') {
          return [];
        }
        // For images, apply basic optimizations
        return [{ width: 1200, crop: 'limit' }];
      },
      // Don't use the attachment flag for PDFs to ensure they can be viewed in browser
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      // Set resource_type based on file type
      type: (req, file) => {
        const extension = path.extname(file.originalname).toLowerCase();
        // For PDFs, ensure they're uploaded as 'raw' type
        if (extension === '.pdf') {
          return 'upload'; // Use standard upload type for PDFs
        }
        return 'auto';
      },
    },
  });
};

// Create upload middleware with specific folder
const upload = (folderName) => {
  const storage = configureStorage(folderName);
  
  // Configure multer with file filtering
  const uploadMiddleware = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const filetypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      
      console.log(`[Upload] File check: ${file.originalname}, mimetype: ${file.mimetype}, valid extension: ${extname}, valid mimetype: ${mimetype}`);
      
      if (extname && mimetype) {
        // For PDFs, set special handling flag
        if (path.extname(file.originalname).toLowerCase() === '.pdf') {
          file.isPdf = true;
          console.log('[Upload] PDF file detected, applying special handling');
        }
        return cb(null, true);
      } else {
        return cb(new Error('Only document and image files are allowed!'));
      }
    }
  }).single('file');
  
  // Wrap the middleware to handle PDF-specific post-processing
  return (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('[Upload] Error in upload middleware:', err);
        return res.status(400).json({ error: err.message });
      }
      
      // If no file was uploaded, continue
      if (!req.file) {
        return next();
      }
      
      try {
        // For PDFs, ensure the URL doesn't have attachment flags
        if (req.file.isPdf || 
            path.extname(req.file.originalname).toLowerCase() === '.pdf' ||
            req.file.mimetype === 'application/pdf') {
          
          console.log('[Upload] Post-processing PDF file');
          
          // If Cloudinary added fl_attachment flag, remove it
          if (req.file.path && req.file.path.includes('fl_attachment')) {
            req.file.path = req.file.path.replace('/upload/fl_attachment/', '/upload/');
            console.log('[Upload] Removed attachment flag from URL:', req.file.path);
          }
        }
        
        next();
      } catch (error) {
        console.error('[Upload] Error in post-processing:', error);
        next();
      }
    });
  };
};

module.exports = upload; 