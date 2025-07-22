const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  subject: String,
  title: String,
  fileUrl: String,
  publicId: String,
  fileName: String, // Name of the file as stored in Supabase
  publicUrl: String, // Publicly accessible URL from Supabase
  uploadDate: { type: Date, default: Date.now },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema); 