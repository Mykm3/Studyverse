// 


const multer = require('multer');
const supabase = require('../config/supabaseClient');

const storage = multer.memoryStorage();

const uploadToSupabase = async (buffer, filename) => {
  const timestamp = Date.now();
  const path = `${timestamp}_${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from('studyverse-uploads').upload(path, buffer, {
    contentType: 'application/octet-stream',
    upsert: true,
  });
  if (error) throw error;

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('studyverse-uploads').getPublicUrl(path);
  if (!publicUrlData || !publicUrlData.publicUrl) throw new Error('Failed to get public URL');

  return {
    path,
    publicUrl: publicUrlData.publicUrl,
  };
};

const validateFile = (file) => {
  const allowedTypes = [
    // Document formats
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Media formats
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    // Image formats
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/gif',
    // Archive formats
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];
  
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
}).single('note');

module.exports = { upload, uploadToSupabase, validateFile };