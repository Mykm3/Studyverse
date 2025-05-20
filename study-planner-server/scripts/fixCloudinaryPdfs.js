const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Note = require('../models/Note');
require('dotenv').config();

/**
 * Utility script to fix PDF documents in Cloudinary that have attachment flags set
 * and prevent them from being viewed inline in the browser.
 * This script:
 * 1. Finds all PDF files in the database
 * 2. For each file, checks if it has fl_attachment flag 
 * 3. Re-uploads the file with proper settings or updates its flags
 */

async function connectToDatabase() {
  console.log('Connecting to database...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

async function fixPdfDocuments() {
  console.log('Starting PDF document fix...');
  
  try {
    // Find all Notes in the database with PDF files
    const notes = await Note.find({
      $or: [
        { fileUrl: { $regex: /\.pdf/i } },
        { fileUrl: { $regex: /application\/pdf/i } }
      ]
    });
    
    console.log(`Found ${notes.length} PDF documents to check`);
    
    // Process each document
    for (const note of notes) {
      try {
        console.log(`Processing document: ${note.title} (${note._id})`);
        
        // Skip documents without a publicId
        if (!note.publicId) {
          console.log(`  - Skipping: No publicId available`);
          continue;
        }
        
        // Check if the URL has fl_attachment flag
        const hasAttachmentFlag = note.fileUrl && 
          (note.fileUrl.includes('fl_attachment') || 
           note.fileUrl.includes('download=true'));
        
        // Get the clean publicId
        let cleanPublicId = note.publicId;
        if (cleanPublicId.includes('.')) {
          cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
        }
        
        console.log(`  - PublicId: ${cleanPublicId}`);
        console.log(`  - Has attachment flag: ${hasAttachmentFlag}`);
        
        if (hasAttachmentFlag) {
          console.log(`  - Fixing attachment flags`);
          
          // Generate a direct Cloudinary URL for viewing with no attachment flag
          const cloudName = cloudinary.config().cloud_name;
          const format = note.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
          const newUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`;
          
          console.log(`  - New URL: ${newUrl}`);
          
          // Update the note with the new URL
          await Note.updateOne(
            { _id: note._id },
            { 
              $set: { 
                fileUrl: newUrl, 
                updatedAt: new Date() 
              } 
            }
          );
          
          console.log(`  - Document updated with new URL`);
        } else {
          console.log(`  - No fixes needed`);
        }
      } catch (error) {
        console.error(`Error processing document ${note._id}:`, error);
      }
    }
    
    console.log('PDF document fix completed');
  } catch (error) {
    console.error('Error during PDF fix:', error);
  }
}

async function main() {
  try {
    await connectToDatabase();
    await fixPdfDocuments();
    
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main(); 