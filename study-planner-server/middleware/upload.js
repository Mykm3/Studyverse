// 


const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'pdf-notes',
        allowed_formats: ['pdf'],
        public_id: options.public_id,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

const validateFile = (file) => {
  const allowedTypes = ['application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('INVALID_FILE_TYPE');
  }
  
  if (file.size > maxSize) {
    throw new Error('FILE_TOO_LARGE');
  }

  return true;
};

const fileFilter = (req, file, cb) => {
  try {
    validateFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
}).single('note'); // Changed from 'file' to 'note'

module.exports = { upload, uploadToCloudinary, validateFile };