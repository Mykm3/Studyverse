const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  subject: String,
  title: String,
  fileUrl: String,
  publicId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema); 