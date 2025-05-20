/**
 * Test script to verify PDF URL format and ensure proper browser display
 * Usage: node scripts/test-pdf-urls.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const { ensureInlineViewing } = require('../config/downloadHelper');

// Load environment variables
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import models
const Note = require('../models/Note');

// Test a URL by checking its headers
async function testUrl(url, description) {
  console.log(`\nTesting ${description}: ${url}`);
  
  try {
    const response = await axios.head(url);
    console.log('✅ URL accessible');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Disposition:', response.headers['content-disposition']);
    
    // Check if this would trigger a download
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('attachment')) {
      console.log('⚠️ WARNING: URL has attachment disposition, will trigger download');
    } else {
      console.log('✅ URL has inline or no disposition, should display in browser');
    }
    
    return {
      url,
      accessible: true,
      status: response.status,
      contentType: response.headers['content-type'],
      contentDisposition: response.headers['content-disposition'],
      triggersDownload: disposition && disposition.includes('attachment')
    };
  } catch (error) {
    console.log('❌ Error accessing URL:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
    
    return {
      url,
      accessible: false,
      error: error.message,
      status: error.response?.status,
    };
  }
}

// Main function
async function main() {
  try {
    console.log('Testing PDF URL configurations...');
    
    // Get a sample PDF document
    const pdfDoc = await Note.findOne({ 
      fileUrl: { $regex: /\.pdf$/i }
    });
    
    if (!pdfDoc) {
      console.log('No PDF documents found in database. Exiting.');
      process.exit(0);
    }
    
    console.log(`Found PDF document: ${pdfDoc.title}`);
    
    // Extract publicId and clean it
    let cleanPublicId = pdfDoc.publicId;
    if (cleanPublicId.includes('.')) {
      cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
    }
    
    // Get cloud name from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      console.error('ERROR: CLOUDINARY_CLOUD_NAME not found in environment variables');
      process.exit(1);
    }
    
    // Generate different URL formats to test
    const urls = [
      {
        url: pdfDoc.fileUrl,
        description: 'Original file URL'
      },
      {
        url: `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.pdf`,
        description: 'Basic raw URL'
      },
      {
        url: `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${cleanPublicId}.pdf`,
        description: 'URL with fl_attachment flag'
      }
    ];
    
    // Test each URL
    const results = [];
    for (const item of urls) {
      const result = await testUrl(item.url, item.description);
      results.push({
        description: item.description,
        ...result
      });
    }
    
    // Test the utility function
    console.log('\nTesting ensureInlineViewing function:');
    for (const item of urls) {
      const fixedUrl = ensureInlineViewing(item.url);
      console.log(`${item.description}:`);
      console.log(`  Original: ${item.url}`);
      console.log(`  Fixed:    ${fixedUrl}`);
      
      // Check if the URL was properly formatted
      if (item.url === fixedUrl && item.url.includes('fl_attachment')) {
        console.log('  ⚠️ WARNING: URL with attachment flag was not modified');
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    const triggersDownload = results.filter(r => r.triggersDownload).length;
    console.log(`URLs tested: ${results.length}`);
    console.log(`URLs accessible: ${results.filter(r => r.accessible).length}`);
    console.log(`URLs triggering download: ${triggersDownload}`);
    
    if (triggersDownload > 0) {
      console.log('\n⚠️ WARNING: Some URLs will trigger download instead of inline viewing.');
      console.log('Make sure your PDF URLs use the correct configuration for browser display.');
    } else {
      console.log('\n✅ All accessible URLs should display inline in the browser.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the main function
main(); 