const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const { downloadFromCloudinary, ensureInlineViewing } = require('../config/downloadHelper');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { upload: uploadMiddleware, uploadToCloudinary, validateFile } = require('../middleware/upload');

// Define the view-pdf endpoint BEFORE applying auth middleware
// This allows direct access with token in query parameter
router.get('/view-pdf/:id', async (req, res) => {
  try {
    console.log('[Notes] View PDF request for document ID:', req.params.id);
    console.log('[Notes] Query parameters:', req.query);
    console.log('[Notes] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }
    
    // Get user from token in query parameter
    let userId;
    
    // Check if token is provided in query parameter
    if (req.query.token) {
      try {
        const jwt = require('jsonwebtoken');
        console.log('[Notes] Token from query parameter:', req.query.token.substring(0, 20) + '...');
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        console.log('[Notes] Decoded token:', decoded);
        
        // Use 'id' property from token
        userId = decoded.id;
        console.log('[Notes] Authenticated via token query parameter, userId:', userId);
      } catch (tokenError) {
        console.error('[Notes] Invalid token in query parameter:', tokenError);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      console.log('[Notes] No authentication token found in query parameters');
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    console.log('[Notes] Looking for document with ID:', req.params.id, 'and userId:', userId);
    
    // Find the document
    const note = await Note.findOne({ _id: req.params.id, userId: userId });
    
    if (!note) {
      console.log('[Notes] Document not found for viewing:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    console.log('[Notes] Found document for viewing:', {
      id: note._id,
      title: note.title,
      publicId: note.publicId || 'Missing',
      fileUrl: note.fileUrl || 'Missing'
    });
    
    if (!note.publicId) {
      return res.status(400).json({ error: 'Document has no associated file' });
    }
    
    // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
    let cleanPublicId = note.publicId;
    
    // Remove file extension if present in the publicId
    if (cleanPublicId.includes('.')) {
      cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
    }
    
    // Remove any fl_attachment flags from the URL if present
    let cloudinaryUrl = note.fileUrl;
    if (cloudinaryUrl && cloudinaryUrl.includes('fl_attachment')) {
      cloudinaryUrl = cloudinaryUrl.replace('/upload/fl_attachment/', '/upload/');
      console.log('[Notes] Removed fl_attachment flag from URL');
    }
    
    // Determine format - default to pdf
    let format = note.fileUrl ? note.fileUrl.split('.').pop().toLowerCase() : 'pdf';
    
    try {
      // First try to use a local copy if available
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filename = `${cleanPublicId.replace(/\//g, '-')}.${format}`;
      const localFilePath = path.join(uploadsDir, filename);
      
      if (fs.existsSync(localFilePath)) {
        console.log(`[Notes] Serving PDF from local storage: ${localFilePath}`);
        
        // CRITICAL: Set proper headers for PDF viewing in browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(note.title || 'document.pdf') + '"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Send file directly instead of streaming
        return res.sendFile(localFilePath);
      }
      
      // If no local copy, get the PDF directly from Cloudinary
      console.log('[Notes] No local copy, fetching from Cloudinary');
      
      // Generate a direct raw URL
      const cloudName = cloudinary.config().cloud_name;
      
      // Be explicit about using raw resource type for proper document delivery
      const viewUrl = ensureInlineViewing(`https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`);
      console.log(`[Notes] Using direct Cloudinary URL: ${viewUrl}`);
      
      // Download the file to local storage for future use
      try {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Use axios to download the file
        const response = await axios({
          method: 'GET',
          url: viewUrl,
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'Accept': '*/*',
            'User-Agent': 'Study-Planner-Server'
          }
        });
        
        // Save to local file
        fs.writeFileSync(localFilePath, response.data);
        console.log(`[Notes] Downloaded PDF to local storage: ${localFilePath}`);
        
        // Set critical headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(note.title || 'document.pdf') + '"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        return res.sendFile(localFilePath);
      } catch (downloadError) {
        console.error('[Notes] Error downloading from Cloudinary:', downloadError);
        
        // If download fails, use a direct response with the raw PDF data
        console.log('[Notes] Trying direct streaming from Cloudinary');
        
        // Resend the request but pipe the response directly
        try {
          const pdfResponse = await axios({
            method: 'GET',
            url: viewUrl,
            responseType: 'stream',
            timeout: 30000
          });
          
          // Apply critical headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(note.title || 'document.pdf') + '"');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          
          // Stream the response
          return pdfResponse.data.pipe(res);
        } catch (streamError) {
          console.error('[Notes] Error streaming from Cloudinary:', streamError);
          throw streamError;
        }
      }
    } catch (err) {
      console.error('[Notes] All PDF serving methods failed:', err);
      
      // Last resort - return a JSON error with direct download link
      const cloudName = cloudinary.config().cloud_name;
      const directUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`;
      
      res.status(500).json({ 
        error: 'Failed to serve PDF document',
        message: err.message,
        downloadUrl: directUrl,
        note: {
          id: note._id,
          title: note.title
        }
      });
    }
  } catch (err) {
    console.error('[Notes] View PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Also define the download endpoint BEFORE applying auth middleware
// This allows direct access with token in query parameter
router.get('/download/:id', async (req, res) => {
  try {
    console.log('[Notes] Download request for document ID:', req.params.id);
    
    // Check if this is a download or view request
    const isDownload = req.query.download === 'true';
    console.log(`[Notes] Request type: ${isDownload ? 'Download' : 'View'}`);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }
    
    // Get user from token - either from auth middleware or from query parameter
    let userId;
    
    // Check if token is provided in query parameter
    if (req.query.token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        userId = decoded.id;
        console.log('[Notes] Authenticated via token query parameter:', userId);
      } catch (tokenError) {
        console.error('[Notes] Invalid token in query parameter:', tokenError);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      console.log('[Notes] No authentication token found in query parameters');
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    // Find the document
    const note = await Note.findOne({ _id: req.params.id, userId: userId });
    
    if (!note) {
      console.log('[Notes] Document not found for download:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    console.log('[Notes] Found document for download:', {
      id: note._id,
      title: note.title,
      publicId: note.publicId || 'Missing'
    });
    
    if (!note.publicId) {
      return res.status(400).json({ error: 'Document has no associated file' });
    }
    
    // Determine resource type based on file extension
    let resourceType = 'raw'; // Default for PDFs and other documents
    let format = note.fileUrl ? note.fileUrl.split('.').pop().toLowerCase() : 'pdf';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(format)) {
      resourceType = 'image';
    } else if (['mp4', 'webm', 'mov', 'ogv'].includes(format)) {
      resourceType = 'video';
    }
    
    // Set the appropriate Content-Type based on format
    const contentTypes = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
    };
    
    // Default content type for PDF or use a format-specific one
    const contentType = contentTypes[format] || 'application/pdf';
    
    // Clean the publicId
    let cleanPublicId = note.publicId;
    if (cleanPublicId.includes('.')) {
      cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
    }
    
    console.log(`[Notes] Downloading file with publicId: ${cleanPublicId}, resource type: ${resourceType}`);
    
    try {
      // First try to get file from local storage if it exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filename = `${cleanPublicId.replace(/\//g, '-')}.${format}`;
      const localFilePath = path.join(uploadsDir, filename);
      
      if (fs.existsSync(localFilePath)) {
        console.log(`[Notes] Serving file from local storage: ${localFilePath}`);
        
        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        
        // Set disposition based on request type
        if (isDownload) {
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.title || 'document')}.${format}"`);
        } else {
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.title || 'document')}.${format}"`);
        }
        
        // Add CORS and caching headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Stream the file
        return fs.createReadStream(localFilePath).pipe(res);
      }
      
      // If file doesn't exist locally, download from Cloudinary first
      console.log(`[Notes] File not found locally, downloading from Cloudinary`);
      
      try {
        const localUrl = await downloadFromCloudinary(cleanPublicId, `${note.title || 'document'}.${format}`, resourceType);
      
        // After download, serve the file
        const newLocalPath = path.join(process.cwd(), localUrl.substring(1)); // Remove leading slash
        
        if (fs.existsSync(newLocalPath)) {
          console.log(`[Notes] Serving downloaded file: ${newLocalPath}`);
          
          // Set appropriate headers
          res.setHeader('Content-Type', contentType);
          
          // Set disposition based on request type
          if (isDownload) {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.title || 'document')}.${format}"`);
          } else {
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.title || 'document')}.${format}"`);
          }
          
          // Add CORS and caching headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          
          // Stream the file
          return fs.createReadStream(newLocalPath).pipe(res);
        }
      } catch (downloadErr) {
        console.error(`[Notes] Error downloading file locally:`, downloadErr);
      }
      
      console.error(`[Notes] Failed to serve file locally, falling back to Cloudinary`);
      
      // As a last resort, try to get from Cloudinary but proxy the response
      // to ensure proper headers
      const cloudName = cloudinary.config().cloud_name;
      // Use raw URL without any problematic flags
      const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`;
      
      try {
        console.log(`[Notes] Fetching and proxying from Cloudinary URL: ${cloudinaryUrl}`);
        const response = await axios({
          method: 'GET',
          url: cloudinaryUrl,
          responseType: 'arraybuffer'
        });
        
        // Set proper headers for browser viewing
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', isDownload ? 
          `attachment; filename="${encodeURIComponent(note.title || 'document')}.${format}"` :
          `inline; filename="${encodeURIComponent(note.title || 'document')}.${format}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Return the response data
        return res.send(response.data);
      } catch (proxyError) {
        console.error(`[Notes] Error proxying from Cloudinary:`, proxyError);
        
        // As a last resort, redirect to Cloudinary URL directly
        console.log(`[Notes] Last resort: redirecting to Cloudinary URL: ${cloudinaryUrl}`);
      return res.redirect(cloudinaryUrl);
      }
    } catch (err) {
      console.error('[Notes] Error serving file from local storage:', err);
      
      // As a last resort, try to redirect to Cloudinary URL directly
      const cloudName = cloudinary.config().cloud_name;
      const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`;
      
      console.log(`[Notes] Redirecting to Cloudinary URL: ${cloudinaryUrl}`);
      return res.redirect(cloudinaryUrl);
    }
  } catch (err) {
    console.error('[Notes] Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Apply authentication middleware to all other routes
router.use(auth);

// Upload Note
router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: 'No file uploaded'
      });
    }

    if (!req.body.subject) {
      return res.status(400).json({
        success: false,
        error: 'NO_SUBJECT',
        message: 'Subject is required'
      });
    }

    // Validate file type and size (redundant, but ensures safety)
    try {
      validateFile(req.file);
    } catch (error) {
      if (error.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: 'Only PDF files are allowed'
        });
      }
      if (error.message === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: 'File size exceeds 10MB limit'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'UPLOAD_FAILED',
        message: 'File upload failed'
      });
    }

    const timestamp = Date.now();
    const publicId = `note_${timestamp}`;
    let result;
    try {
      result = await uploadToCloudinary(req.file.buffer, { public_id: publicId });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'UPLOAD_FAILED',
        message: 'File upload failed'
      });
    }

    // Save note to DB
    const title = req.body.title || result.original_filename;
    const fileUrl = result.secure_url.replace('http://', 'https://');
    const note = await Note.create({
      subject: req.body.subject,
      title: title,
      fileUrl,
      publicId: result.public_id,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      fileUrl, // <-- add this line for frontend compatibility
      file: {
        id: result.public_id,
        url: fileUrl,
        filename: result.original_filename,
        size: result.bytes,
        format: result.format,
        uploadedAt: new Date().toISOString(),
        noteId: note._id,
        subject: note.subject,
        title: note.title
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds 10MB limit'
      });
    }
    if (error.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Only PDF files are allowed'
      });
    }
    res.status(500).json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: 'File upload failed'
    });
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
    
    // Process notes to ensure HTTPS URLs and add Cloudinary URLs
    const processedNotes = await Promise.all(notes.map(async note => {
      const noteObj = note.toObject();
      
      // Ensure HTTPS URL if fileUrl exists
      if (noteObj.fileUrl) {
        noteObj.fileUrl = noteObj.fileUrl.replace('http://', 'https://');
        
        // Also apply ensureInlineViewing to ensure PDF viewing behavior
        if (noteObj.fileUrl.toLowerCase().endsWith('.pdf')) {
          noteObj.fileUrl = ensureInlineViewing(noteObj.fileUrl);
        }
      }
      
      // Add Cloudinary URL if document has a publicId
      if (note.publicId) {
        try {
          // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
          let cleanPublicId = note.publicId;
          
          // Remove file extension if present in the publicId
          if (cleanPublicId.includes('.')) {
            cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
          }
          
          // Check the file type to determine the resource_type
          let format = note.fileUrl?.split('.')?.pop()?.toLowerCase() || 'pdf';
          
          // Always use 'raw' resource type for documents (PDFs, DOCs, etc)
          // This ensures browser viewing instead of downloading
          const resourceType = 'raw';
          
          // Generate direct Cloudinary URL without signed URLs or expiry
          // Format: https://res.cloudinary.com/<cloud-name>/raw/upload/<public-id>.<ext>
          const cloudName = cloudinary.config().cloud_name;
          const directUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}.${format}`;
          
          // Ensure proper URL for browser viewing of PDF documents
          noteObj.cloudinaryUrl = ensureInlineViewing(directUrl);
          
          console.log(`[Notes] Generated direct Cloudinary URL for ${noteObj._id}: ${noteObj.cloudinaryUrl}`);
          
          // Also include the original Cloudinary URL as a fallback
          noteObj.originalFileUrl = ensureInlineViewing(noteObj.fileUrl);
        } catch (error) {
          console.error(`[Notes] Error generating Cloudinary URL for note ${noteObj._id}:`, error);
        }
      }
      
      return noteObj;
    }));
    
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
        
        // For PDFs and other documents, use direct URL instead of attachment flag
        if (resourceType === 'raw') {
          const cloudName = cloudinary.config().cloud_name;
          const directUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}.${format}`;
          pdfUrl = ensureInlineViewing(directUrl);
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
        
        console.log('[Notes] Generated URL:', pdfUrl);
        
        // Also download the file locally
        try {
          const localUrl = await downloadFromCloudinary(cleanPublicId, note.title || 'document.pdf', resourceType);
          console.log(`[Notes] Downloaded file locally at: ${localUrl}`);
          
          // Add both URLs to the result
          result.fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}${localUrl}`; // Local URL as primary
          result.cloudinaryUrl = ensureInlineViewing(pdfUrl); // Cloudinary URL as backup
        } catch (downloadErr) {
          console.error('[Notes] Error downloading file locally:', downloadErr);
          // If local download fails, fall back to Cloudinary URL
          result.fileUrl = pdfUrl;
        }
        
        // Keep the original URL as another fallback
        result.originalFileUrl = note.fileUrl ? ensureInlineViewing(note.fileUrl.replace('http://', 'https://')) : null;
      } catch (urlError) {
        console.error('[Notes] Error generating signed URL:', urlError);
        // If we can't generate a signed URL, use the original URL but it might not work
        result.fileUrl = note.fileUrl ? ensureInlineViewing(note.fileUrl.replace('http://', 'https://')) : null;
      }
    } else if (note.fileUrl) {
      // If no publicId but we have a fileUrl, just ensure it uses HTTPS
      result.fileUrl = note.fileUrl.replace('http://', 'https://');
      
      // Apply ensureInlineViewing for PDFs
      if (result.fileUrl.toLowerCase().endsWith('.pdf')) {
        result.fileUrl = ensureInlineViewing(result.fileUrl);
      }
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
    
    // If document has a Cloudinary publicId, generate a direct URL
    if (note.publicId) {
      try {
        console.log('[Notes] Generating direct Cloudinary URL for document with publicId:', note.publicId);
        
        // Clean the publicId - Cloudinary typically doesn't include file extensions in the publicId
        let cleanPublicId = note.publicId;
        
        // Remove file extension if present in the publicId
        if (cleanPublicId.includes('.')) {
          cleanPublicId = cleanPublicId.substring(0, cleanPublicId.lastIndexOf('.'));
        }
        
        // Use file extension from the fileUrl or default to pdf
        const format = note.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
        
        // Always use 'raw' resource type for documents to ensure browser viewing
        const cloudName = cloudinary.config().cloud_name;
        const directUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${cleanPublicId}.${format}`;
        
        // Ensure the URL has the proper format for browser viewing
        result.cloudinaryUrl = ensureInlineViewing(directUrl);
        
        console.log('[Notes] Generated direct Cloudinary URL:', result.cloudinaryUrl);
        
        // Use the direct Cloudinary URL as primary
        result.fileUrl = result.cloudinaryUrl;
        
        // Keep the original URL as a fallback
        result.originalFileUrl = note.fileUrl ? ensureInlineViewing(note.fileUrl.replace('http://', 'https://')) : null;
      } catch (urlError) {
        console.error('[Notes] Error generating Cloudinary URL:', urlError);
        // If we can't generate a URL, use the original URL
        result.fileUrl = note.fileUrl ? ensureInlineViewing(note.fileUrl.replace('http://', 'https://')) : null;
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

// Get documents by subject
router.get('/by-subject/:subject', auth, async (req, res) => {
  console.log('[Notes] Fetching documents for subject:', req.params.subject);
  
  try {
    const subject = req.params.subject;
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject name is required',
        data: []
      });
    }
    
    const notes = await Note.find({ 
      userId: req.user._id,
      subject: subject
    }).sort({ createdAt: -1 });
    
    console.log(`[Notes] Found ${notes.length} documents for subject "${subject}"`);
    
    // Process notes to ensure HTTPS URLs
    const processedNotes = notes.map(note => {
      const noteObj = note.toObject();
      
      // Ensure HTTPS URL if fileUrl exists
      if (noteObj.fileUrl) {
        noteObj.fileUrl = noteObj.fileUrl.replace('http://', 'https://');
      }
      
      return noteObj;
    });
    
    res.status(200).json({
      success: true,
      data: processedNotes || []
    });
  } catch (err) {
    console.error('[Notes] Error fetching documents by subject:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      success: false,
      error: err.message,
      data: [] 
    });
  }
});

module.exports = router; 