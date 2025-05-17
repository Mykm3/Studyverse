const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const { downloadFromCloudinary } = require('../config/downloadHelper');

// Apply authentication middleware to all routes
router.use(auth);

// Upload Note
router.post('/upload', upload('note'), async (req, res) => {
  console.log('[Notes] Received file upload request:', {
    subject: req.body.subject,
    title: req.body.title,
    fileInfo: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      publicId: req.file.filename
    } : null,
    userId: req.user._id
  });

  try {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!req.body.subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    // Validate Cloudinary URL
    if (!req.file.path || !req.file.filename) {
      console.error('[Notes] Invalid Cloudinary response:', req.file);
      return res.status(500).json({ error: 'Invalid file upload response' });
    }

    // Ensure HTTPS URL
    const fileUrl = req.file.path.replace('http://', 'https://');
    console.log('[Notes] Cloudinary URL:', fileUrl);
    
    // Use provided title or original filename if title is not provided
    const title = req.body.title || req.file.originalname;
    
    console.log('[Notes] Creating note in database...');
    const note = await Note.create({
      subject: req.body.subject,
      title: title,
      fileUrl,
      publicId: req.file.filename,
      userId: req.user._id,
    });
    
    console.log('[Notes] Note created successfully:', {
      noteId: note._id,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl,
      publicId: note.publicId
    });
    
    // Verify the file is accessible
    try {
      const result = await cloudinary.api.resource(note.publicId);
      console.log('[Notes] Verified Cloudinary resource:', {
        publicId: result.public_id,
        format: result.format,
        url: result.secure_url
      });
    } catch (error) {
      console.error('[Notes] Failed to verify Cloudinary resource:', error);
      // Don't fail the request, but log the error
    }
    
    // Send the response with the proper URL
    res.status(201).json({
      _id: note._id,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl, // This should be the HTTPS URL
      publicId: note.publicId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (err) {
    console.error('[Notes] Upload error:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file
    });
    res.status(500).json({ error: err.message });
  }
});

// Get all notes for a user
router.get('/', async (req, res) => {
  console.log('[Notes] Fetching all notes for user:', req.user._id);
  
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
    console.log('[Notes] Successfully fetched notes:', {
      count: notes.length,
      userId: req.user._id
    });
    
    // Process notes to ensure HTTPS URLs
    const processedNotes = notes.map(note => {
      const noteObj = note.toObject();
      
      // Ensure HTTPS URL if fileUrl exists
      if (noteObj.fileUrl) {
        noteObj.fileUrl = noteObj.fileUrl.replace('http://', 'https://');
        console.log('[Notes] Processed note URL:', {
          id: noteObj._id,
          fileUrl: noteObj.fileUrl
        });
      } else {
        console.warn('[Notes] Note missing fileUrl:', noteObj._id);
      }
      
      return noteObj;
    });
    
    // Ensure we always return an array
    res.status(200).json({
      success: true,
      data: processedNotes || []
    });
  } catch (err) {
    console.error('[Notes] Error fetching notes:', {
      message: err.message,
      stack: err.stack,
      userId: req.user._id
    });
    res.status(500).json({ 
      success: false,
      error: err.message,
      data: [] // Return empty array on error
    });
  }
});

// Get unique subjects for a user
router.get('/subjects', async (req, res) => {
  console.log('[Notes] Fetching unique subjects for user:', req.user?._id || 'undefined');
  
  try {
    // Check if req.user exists and has _id
    if (!req.user || !req.user._id) {
      console.error('[Notes] Error in /subjects route: req.user or req.user._id is undefined', {
        hasUser: Boolean(req.user),
        userId: req.user ? req.user._id : 'undefined'
      });
      return res.status(400).json({
        success: false,
        error: 'User ID is missing or invalid',
        data: []
      });
    }
    
    console.log('[Notes] Finding notes for user:', req.user._id);
    
    // Find all notes for the user
    const notes = await Note.find({ userId: req.user._id });
    
    console.log(`[Notes] Found ${notes.length} notes for user ${req.user._id}`);
    
    // Extract unique subjects
    const uniqueSubjects = [...new Set(notes.map(note => note.subject))];
    
    console.log('[Notes] Extracted unique subjects:', uniqueSubjects);
    
    // Count notes per subject
    const subjectsWithCount = uniqueSubjects.map(subject => {
      const count = notes.filter(note => note.subject === subject).length;
      return {
        id: subject.toLowerCase().replace(/\s+/g, '-'), // Create an ID from the subject name
        name: subject,
        documentsCount: count
      };
    });
    
    console.log('[Notes] Found subjects with counts:', subjectsWithCount);
    
    res.status(200).json({
      success: true,
      data: subjectsWithCount || []
    });
  } catch (err) {
    console.error('[Notes] Error fetching subjects:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      userId: req.user?._id || 'undefined'
    });
    res.status(500).json({ 
      success: false,
      error: `Server error: ${err.message}`,
      data: [] // Return empty array on error
    });
  }
});

// Get a document by title
router.get('/view', async (req, res) => {
  console.log('[Notes] Fetching document by title:', {
    title: req.query.title,
    userId: req.user._id
  });

  try {
    // Validate required query parameters
    if (!req.query.title) {
      console.log('[Notes] Error: Document title is missing');
      return res.status(400).json({ 
        success: false,
        error: 'Document title is required' 
      });
    }

    // Log the search parameters
    console.log('[Notes] Searching for document with criteria:', {
      title: req.query.title,
      userId: req.user._id.toString()
    });

    // First, check if any documents exist for this user
    const userDocumentCount = await Note.countDocuments({ userId: req.user._id });
    console.log(`[Notes] User has ${userDocumentCount} total documents`);

    // Find the document by title and user ID
    const note = await Note.findOne({ 
      title: req.query.title, 
      userId: req.user._id 
    });
    
    if (!note) {
      // If document not found, try to find documents with similar titles to help debugging
      const similarTitles = await Note.find({ 
        userId: req.user._id 
      }).select('title').limit(5);
      
      console.log('[Notes] Document not found. Similar documents for this user:', 
        similarTitles.map(doc => doc.title));
        
      return res.status(404).json({ 
        success: false,
        error: 'Document not found',
        debug: {
          searchedTitle: req.query.title,
          userDocumentCount,
          similarDocuments: similarTitles.map(doc => doc.title)
        }
      });
    }
    
    console.log('[Notes] Successfully fetched document:', {
      noteId: note._id,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl ? 'Present' : 'Missing',
      publicId: note.publicId || 'Missing'
    });
    
    // Convert to a regular object
    const result = note.toObject();
    
    // If document has a Cloudinary publicId, generate a signed URL
    if (note.publicId) {
      try {
        console.log('[Notes] Attempting to generate signed URL for document with publicId:', note.publicId);
        
        // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
        let cleanPublicId = note.publicId;
        
        // Remove file extension if present in the publicId
        if (cleanPublicId.includes('.')) {
          cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
        }
        
        // Check the file type to determine the resource_type
        let resourceType = 'raw'; // Default for PDFs and other documents
        let format = note.fileUrl.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(format)) {
          resourceType = 'image';
        } else if (['mp4', 'webm', 'mov', 'ogv'].includes(format)) {
          resourceType = 'video';
        }
        
        console.log(`[Notes] Using resource_type ${resourceType} for format ${format}`);
        
        // First try to use the direct delivery URL which is more reliable for documents
        let pdfUrl;
        
        // For PDFs and other documents, use the dl=1 parameter for direct download
        if (resourceType === 'raw') {
          pdfUrl = cloudinary.url(cleanPublicId, {
            secure: true,
            resource_type: resourceType,
            format: format,
            type: 'upload',
            sign_url: true,
            flags: 'attachment',
            download: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
          });
        } else {
          // For images and videos
          pdfUrl = cloudinary.url(cleanPublicId, {
            secure: true,
            resource_type: resourceType,
            format: format,
            type: 'upload',
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
          });
        }
        
        console.log('[Notes] Generated signed URL:', pdfUrl);
        
        // Also download the file locally
        try {
          const localUrl = await downloadFromCloudinary(cleanPublicId, note.title || 'document.pdf', resourceType);
          console.log(`[Notes] Downloaded file locally at: ${localUrl}`);
          
          // Add both URLs to the result
          result.fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}${localUrl}`; // Local URL as primary
          result.cloudinaryUrl = pdfUrl; // Cloudinary URL as backup
        } catch (downloadErr) {
          console.error('[Notes] Error downloading file locally:', downloadErr);
          // If local download fails, fall back to Cloudinary URL
          result.fileUrl = pdfUrl;
        }
        
        // Keep the original URL as another fallback
        result.originalFileUrl = note.fileUrl ? note.fileUrl.replace('http://', 'https://') : null;
      } catch (urlError) {
        console.error('[Notes] Error generating signed URL:', urlError);
        // If we can't generate a signed URL, use the original URL but it might not work
        result.fileUrl = note.fileUrl ? note.fileUrl.replace('http://', 'https://') : null;
      }
    } else if (note.fileUrl) {
      // If no publicId but we have a fileUrl, just ensure it uses HTTPS
      result.fileUrl = note.fileUrl.replace('http://', 'https://');
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Notes] Error fetching document by title:', {
      message: err.message,
      stack: err.stack,
      title: req.query.title,
      userId: req.user ? req.user._id : 'Unknown user'
    });
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get a document by ID for viewing
router.get('/view/:id', async (req, res) => {
  console.log('[Notes] Fetching document by ID:', {
    id: req.params.id,
    userId: req.user._id
  });

  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid document ID format'
      });
    }

    // Find the document by ID and user ID
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) {
      console.log('[Notes] Document not found:', {
        id: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    console.log('[Notes] Successfully fetched document:', {
      noteId: note._id,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl ? 'Present' : 'Missing',
      publicId: note.publicId || 'Missing'
    });
    
    // Convert to a regular object
    const result = note.toObject();
    
    // If document has a Cloudinary publicId, generate a signed URL
    if (note.publicId) {
      try {
        console.log('[Notes] Attempting to generate signed URL for document with publicId:', note.publicId);
        
        // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
        let cleanPublicId = note.publicId;
        
        // Remove file extension if present in the publicId
        if (cleanPublicId.includes('.')) {
          cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
        }
        
        // Check the file type to determine the resource_type
        let resourceType = 'raw'; // Default for PDFs and other documents
        let format = note.fileUrl.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(format)) {
          resourceType = 'image';
        } else if (['mp4', 'webm', 'mov', 'ogv'].includes(format)) {
          resourceType = 'video';
        }
        
        console.log(`[Notes] Using resource_type ${resourceType} for format ${format}`);
        
        // First try to use the direct delivery URL which is more reliable for documents
        let pdfUrl;
        
        // For PDFs and other documents, use the dl=1 parameter for direct download
        if (resourceType === 'raw') {
          pdfUrl = cloudinary.url(cleanPublicId, {
            secure: true,
            resource_type: resourceType,
            format: format,
            type: 'upload',
            sign_url: true,
            flags: 'attachment',
            download: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
          });
        } else {
          // For images and videos
          pdfUrl = cloudinary.url(cleanPublicId, {
            secure: true,
            resource_type: resourceType,
            format: format,
            type: 'upload',
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
          });
        }
        
        console.log('[Notes] Generated signed URL:', pdfUrl);
        
        // Also download the file locally
        try {
          const localUrl = await downloadFromCloudinary(cleanPublicId, note.title || 'document.pdf', resourceType);
          console.log(`[Notes] Downloaded file locally at: ${localUrl}`);
          
          // Add both URLs to the result
          result.fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}${localUrl}`; // Local URL as primary
          result.cloudinaryUrl = pdfUrl; // Cloudinary URL as backup
        } catch (downloadErr) {
          console.error('[Notes] Error downloading file locally:', downloadErr);
          // If local download fails, fall back to Cloudinary URL
          result.fileUrl = pdfUrl;
        }
        
        // Keep the original URL as another fallback
        result.originalFileUrl = note.fileUrl ? note.fileUrl.replace('http://', 'https://') : null;
      } catch (urlError) {
        console.error('[Notes] Error generating signed URL:', urlError);
        // If we can't generate a signed URL, use the original URL but it might not work
        result.fileUrl = note.fileUrl ? note.fileUrl.replace('http://', 'https://') : null;
      }
    } else if (note.fileUrl) {
      // If no publicId but we have a fileUrl, just ensure it uses HTTPS
      result.fileUrl = note.fileUrl.replace('http://', 'https://');
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Notes] Error fetching document by ID:', {
      message: err.message,
      stack: err.stack,
      id: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get a specific note
router.get('/:id', async (req, res) => {
  console.log('[Backend] Fetching specific note:', {
    noteId: req.params.id,
    userId: req.user._id
  });

  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) {
      console.log('[Backend] Note not found:', {
        noteId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ error: 'Note not found' });
    }
    
    console.log('[Backend] Successfully fetched note:', {
      noteId: note._id,
      subject: note.subject,
      title: note.title
    });
    
    res.status(200).json(note);
  } catch (err) {
    console.error('[Backend] Error fetching specific note:', {
      message: err.message,
      stack: err.stack,
      noteId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({ error: err.message });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  console.log('[Backend] Deleting note:', {
    noteId: req.params.id,
    userId: req.user._id
  });

  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) {
      console.log('[Backend] Note not found for deletion:', {
        noteId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Delete from Cloudinary
    if (note.publicId) {
      console.log('[Backend] Deleting file from Cloudinary:', {
        publicId: note.publicId
      });
      await cloudinary.uploader.destroy(note.publicId);
    }
    
    // Delete from database
    console.log('[Backend] Deleting note from database:', {
      noteId: note._id
    });
    await Note.findByIdAndDelete(req.params.id);
    
    console.log('[Backend] Note deleted successfully:', {
      noteId: req.params.id
    });
    
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('[Backend] Error deleting note:', {
      message: err.message,
      stack: err.stack,
      noteId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({ error: err.message });
  }
});

// Test Cloudinary URL
router.get('/test-cloudinary/:publicId', auth, async (req, res) => {
  const { publicId } = req.params;
  
  console.log('[Notes] Testing Cloudinary URL for publicId:', publicId);
  
  try {
    // Try to get the resource from Cloudinary
    const result = await cloudinary.api.resource(publicId);
    
    console.log('[Notes] Cloudinary resource details:', {
      publicId: result.public_id,
      format: result.format,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      type: result.type,
      created: result.created_at
    });
    
    // Return the resource details
    res.json({
      success: true,
      resource: {
        publicId: result.public_id,
        format: result.format,
        url: result.url,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        type: result.type,
        created: result.created_at
      }
    });
  } catch (error) {
    console.error('[Notes] Error fetching Cloudinary resource:', error);
    res.status(404).json({
      success: false,
      error: 'Resource not found or inaccessible',
      message: error.message
    });
  }
});

// Test file URL accessibility
router.post('/test-url', auth, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }
  
  console.log('[Notes] Testing URL accessibility:', url);
  
  try {
    // Special handling for Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      console.log('[Notes] Detected Cloudinary URL');
      
      // For Cloudinary, we'll consider it accessible without direct testing
      // since Cloudinary often restricts direct HEAD requests
      return res.json({
        success: true,
        accessible: true,
        isCloudinaryUrl: true,
        message: 'Cloudinary URL format detected - assuming accessible'
      });
    }
    
    // For other URLs, do a normal HEAD request
    const fetch = await import('node-fetch');
    const response = await fetch.default(url, { method: 'HEAD' });
    
    console.log('[Notes] URL test response:', {
      url,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    if (response.ok) {
      res.json({
        success: true,
        accessible: true,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
    } else {
      res.json({
        success: true,
        accessible: false,
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    console.error('[Notes] Error testing URL:', error);
    
    // Even if there's an error with Cloudinary URLs, assume they're valid
    if (url.includes('cloudinary.com')) {
      return res.json({
        success: true,
        accessible: true,
        isCloudinaryUrl: true,
        message: 'Cloudinary URL format detected - assuming accessible despite fetch error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      accessible: false,
      error: error.message
    });
  }
});

// Check Cloudinary configuration
router.get('/check-cloudinary', auth, async (req, res) => {
  console.log('[Notes] Checking Cloudinary configuration');
  
  try {
    // Check Cloudinary configuration
    const config = cloudinary.config();
    
    // Test Cloudinary connection by getting account info
    const result = await cloudinary.api.ping();
    
    console.log('[Notes] Cloudinary configuration:', {
      cloudName: config.cloud_name ? 'Present' : 'Missing',
      apiKey: config.api_key ? 'Present' : 'Missing',
      apiSecret: config.api_secret ? 'Present' : 'Missing',
      secureDistribution: config.secure_distribution,
      ping: result
    });
    
    // Return configuration status
    res.json({
      success: true,
      config: {
        cloudName: config.cloud_name ? 'Present' : 'Missing',
        apiKey: config.api_key ? 'Present' : 'Missing',
        apiSecret: config.api_secret ? 'Present' : 'Missing',
        secure: config.secure
      },
      ping: result
    });
  } catch (error) {
    console.error('[Notes] Error checking Cloudinary configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Cloudinary configuration',
      message: error.message
    });
  }
});

// Clear all notes for a user
router.delete('/clear-all', auth, async (req, res) => {
  console.log('[Notes] Clearing all notes for user:', req.user._id);
  
  try {
    // Find all notes for the user
    const notes = await Note.find({ userId: req.user._id });
    console.log(`[Notes] Found ${notes.length} notes to delete`);
    
    // Delete each note's file from Cloudinary
    const deletePromises = notes.map(async (note) => {
      if (note.publicId) {
        try {
          console.log(`[Notes] Deleting file from Cloudinary: ${note.publicId}`);
          await cloudinary.uploader.destroy(note.publicId);
          console.log(`[Notes] Successfully deleted file: ${note.publicId}`);
        } catch (error) {
          console.error(`[Notes] Error deleting file from Cloudinary: ${note.publicId}`, error);
          // Continue with deletion even if Cloudinary fails
        }
      }
      return note._id;
    });
    
    // Wait for all Cloudinary deletions to complete
    await Promise.all(deletePromises);
    
    // Delete all notes from the database
    const result = await Note.deleteMany({ userId: req.user._id });
    
    console.log(`[Notes] Successfully deleted ${result.deletedCount} notes from database`);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} notes and their associated files` 
    });
  } catch (err) {
    console.error('[Notes] Error clearing notes:', {
      message: err.message,
      stack: err.stack,
      userId: req.user._id
    });
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Debug endpoint for troubleshooting
router.get('/debug', async (req, res) => {
  console.log('[Notes] Debug endpoint called');
  
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';
    
    // Check if Note model exists and has expected methods
    const noteModelExists = !!Note;
    
    // Try a simple query that doesn't depend on authentication
    let noteCount = 0;
    let error = null;
    
    try {
      noteCount = await Note.countDocuments();
    } catch (err) {
      error = {
        message: err.message,
        stack: err.stack,
        name: err.name
      };
    }
    
    // Return diagnostics
    res.json({
      success: true,
      diagnostics: {
        database: {
          status: dbStatus,
          statusText: dbStatusText,
          connected: dbStatus === 1
        },
        model: {
          exists: noteModelExists,
          name: noteModelExists ? Note.modelName : null
        },
        counts: {
          notes: noteCount
        },
        error
      }
    });
  } catch (err) {
    console.error('[Notes] Debug endpoint error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router; 