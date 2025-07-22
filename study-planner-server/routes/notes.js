const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { upload: uploadMiddleware, uploadToSupabase, validateFile } = require('../middleware/upload');
const supabase = require('../config/supabaseClient'); // Add this import at the top
const { v4: uuidv4 } = require('uuid');

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
    
    if (!note || !note.publicUrl) {
      console.log('[Notes] Document not found for viewing:', req.params.id);
      return res.status(404).json({ error: 'Document not found or missing public URL' });
    }
    
    console.log('[Notes] Found document for viewing:', {
      id: note._id,
      title: note.title,
      fileUrl: note.fileUrl || 'Missing',
      publicUrl: note.publicUrl || 'Missing'
    });
    
    // Redirect to Supabase public URL for inline viewing
    return res.redirect(note.publicUrl);
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
    
    if (!note || !note.publicUrl) {
      console.log('[Notes] Document not found for download:', req.params.id);
      return res.status(404).json({ error: 'Document not found or missing public URL' });
    }
    
    console.log('[Notes] Found document for download:', {
      id: note._id,
      title: note.title,
      publicUrl: note.publicUrl || 'Missing'
    });
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.fileName || note.title || 'document.pdf')}"`);
    return res.redirect(note.publicUrl);
  } catch (err) {
    console.error('[Notes] Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Direct view endpoint for PDFs and other documents - no redirects, serves content directly
router.get('/direct-view/:id', async (req, res) => {
  try {
    console.log('[Notes] Direct view request for document ID:', req.params.id);
    
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
    } else if (req.user) {
      // Use user from auth middleware if available
      userId = req.user._id;
    } else {
      console.log('[Notes] No authentication found for direct view request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find the document
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: userId 
    });
    
    if (!note || !note.publicUrl) {
      console.log('[Notes] Document not found for direct view:', req.params.id);
      return res.status(404).json({ error: 'Document not found or missing public URL' });
    }
    
    console.log('[Notes] Found document for direct view:', {
      id: note._id,
      title: note.title,
      publicUrl: note.publicUrl || 'Missing'
    });
    
    // Determine the content type based on file extension
    const fileExtension = note.fileName?.split('.').pop()?.toLowerCase() || 
                         note.publicUrl?.split('.').pop()?.toLowerCase() || 
                         'pdf';
                         
    const contentTypeMap = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    
    const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
    
    // Fetch the file from Supabase
    const axios = require('axios');
    
    try {
      console.log('[Notes] Fetching file from Supabase:', note.publicUrl);
      const response = await axios({
        method: 'get',
        url: note.publicUrl,
        responseType: 'arraybuffer', // Use arraybuffer for better handling
        timeout: 30000 // 30 second timeout
      });
      
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      
      // Check if this is a download request
      const isDownload = req.query.download === 'true';

      // Set content disposition based on whether this is a download or view request
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.fileName || note.title || 'document.' + fileExtension)}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.fileName || note.title || 'document.' + fileExtension)}"`);
      }
      
      // Add CORS headers to allow embedding
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Add cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Send the file data directly
      return res.send(response.data);
    } catch (fetchError) {
      console.error('[Notes] Error fetching file from Supabase:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch file from storage' });
    }
  } catch (err) {
    console.error('[Notes] Direct view error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Apply authentication middleware to all other routes
router.use(auth);

// Upload Note
router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create a unique file path with timestamp and UUID
    const filePath = `${Date.now()}-${uuidv4()}_${file.originalname}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('studyverse-uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
      
    if (error) {
      console.error('[Supabase Upload Error]', error);
      return res.status(500).json({ message: 'Upload failed', supabaseError: error });
    }
    
    // Get public URL
    const { data: publicData, error: urlError } = supabase.storage
      .from('studyverse-uploads')
      .getPublicUrl(filePath);
      
    if (urlError) {
      console.error('[Public URL Error]', urlError);
      return res.status(500).json({ message: 'Failed to get public URL', supabaseError: urlError });
    }
    
    // Create a new note in the database
    const note = new Note({
      userId: req.user._id,
      subject: req.body.subject,
      title: req.body.title || file.originalname,
      fileName: file.originalname,
      fileUrl: publicData.publicUrl,
      publicUrl: publicData.publicUrl
    });
    
    await note.save();
    
    return res.status(200).json({
      message: 'Upload successful',
      publicUrl: publicData.publicUrl,
      filePath,
      noteId: note._id
    });
  } catch (err) {
    console.error('[Upload Catch Block Error]', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
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
      }
      
      // Ensure publicUrl is also HTTPS
      if (noteObj.publicUrl) {
        noteObj.publicUrl = noteObj.publicUrl.replace('http://', 'https://');
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
      publicUrl: note.publicUrl ? 'Present' : 'Missing'
    });
    
    // Convert to a regular object
    const result = note.toObject();
    
    // Ensure HTTPS URLs
    if (result.fileUrl) {
      result.fileUrl = result.fileUrl.replace('http://', 'https://');
    }
    
    if (result.publicUrl) {
      result.publicUrl = result.publicUrl.replace('http://', 'https://');
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
      publicUrl: note.publicUrl ? 'Present' : 'Missing'
    });
    
    // Convert to a regular object
    const result = note.toObject();
    
    // Ensure HTTPS URLs
    if (result.fileUrl) {
      result.fileUrl = result.fileUrl.replace('http://', 'https://');
    }
    
    if (result.publicUrl) {
      result.publicUrl = result.publicUrl.replace('http://', 'https://');
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
    
    // If the note has a file in Supabase, delete it
    if (note.fileUrl && note.fileUrl.includes('supabase')) {
      try {
        // Extract the file path from the URL
        // Example URL: https://xxxx.supabase.co/storage/v1/object/public/studyverse-uploads/filename.pdf
        const fileUrl = new URL(note.fileUrl);
        const pathParts = fileUrl.pathname.split('/');
        const filePath = pathParts[pathParts.length - 1];
        
        console.log('[Backend] Deleting file from Supabase:', {
          filePath
        });
        
        const { error } = await supabase.storage
          .from('studyverse-uploads')
          .remove([filePath]);
          
        if (error) {
          console.error('[Backend] Error deleting file from Supabase:', error);
        }
      } catch (deleteError) {
        console.error('[Backend] Error deleting file from Supabase:', deleteError);
        // Continue with note deletion even if file deletion fails
      }
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

// Add a proxy endpoint to serve files through our server
router.get('/proxy/:id', async (req, res) => {
  try {
    console.log('[Notes] Proxy request for document ID:', req.params.id);
    
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
    } else if (req.user) {
      // Use user from auth middleware if available
      userId = req.user._id;
    } else {
      console.log('[Notes] No authentication found for proxy request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find the document
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: userId 
    });
    
    if (!note || !note.publicUrl) {
      console.log('[Notes] Document not found for proxy:', req.params.id);
      return res.status(404).json({ error: 'Document not found or missing public URL' });
    }
    
    console.log('[Notes] Found document for proxy:', {
      id: note._id,
      title: note.title,
      publicUrl: note.publicUrl || 'Missing'
    });
    
    // Determine the content type based on file extension
    const fileExtension = note.fileName?.split('.').pop()?.toLowerCase() || 
                         note.publicUrl?.split('.').pop()?.toLowerCase() || 
                         'pdf';
                         
    const contentTypeMap = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    
    const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
    
    // Fetch the file from Supabase
    const axios = require('axios');
    const response = await axios({
      method: 'get',
      url: note.publicUrl,
      responseType: 'stream',
      timeout: 30000 // 30 second timeout
    });
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || contentType);
    
    // For PDFs, set to inline display. For other types, use attachment to force download
    const disposition = fileExtension === 'pdf' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(note.fileName || note.title || 'document.' + fileExtension)}"`);
    
    // Add cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Pipe the file data to the response
    response.data.pipe(res);
  } catch (err) {
    console.error('[Notes] Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve file content directly from Supabase - most reliable cross-browser solution
router.get('/serve/:id', async (req, res) => {
  try {
    console.log('[Notes] Serve request for document ID:', req.params.id);
    
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
    } else if (req.user) {
      // Use user from auth middleware if available
      userId = req.user._id;
    } else {
      console.log('[Notes] No authentication found for serve request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find the document
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: userId 
    });
    
    if (!note) {
      console.log('[Notes] Document not found for serving:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (!note.fileName || !note.publicUrl) {
      console.log('[Notes] Document missing fileName or publicUrl:', req.params.id);
      return res.status(400).json({ error: 'Document missing required file information' });
    }
    
    console.log('[Notes] Found document for serving:', {
      id: note._id,
      title: note.title,
      fileName: note.fileName,
      publicUrl: note.publicUrl ? 'Present' : 'Missing'
    });
    
    // Extract the path from the publicUrl
    // Example: https://pnkiiemzpgdgxnhomvws.supabase.co/storage/v1/object/public/studyverse-uploads/1753126653300-file.pdf
    const url = new URL(note.publicUrl);
    const pathParts = url.pathname.split('/');
    const bucketName = pathParts[pathParts.length - 2]; // 'studyverse-uploads'
    const filePath = pathParts[pathParts.length - 1];   // '1753126653300-file.pdf'
    
    console.log('[Notes] Extracted file path:', {
      bucketName,
      filePath
    });
    
    // Download the file directly from Supabase
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error('[Notes] Supabase download error:', error);
      return res.status(500).json({ error: 'Failed to fetch file from storage' });
    }
    
    if (!data) {
      console.error('[Notes] No data returned from Supabase');
      return res.status(500).json({ error: 'No data received from storage' });
    }
    
    // Determine content type based on file extension
    const fileExtension = note.fileName.split('.').pop().toLowerCase();
    const mime = require('mime-types');
    const contentType = mime.lookup(fileExtension) || 'application/octet-stream';
    
    // Check if this is a download request
    const isDownload = req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(note.fileName)}"`);
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Add cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    
    // Send the file data directly
    return res.send(data);
  } catch (err) {
    console.error('[Notes] Serve error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 