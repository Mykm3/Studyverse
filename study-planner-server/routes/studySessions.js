const express = require('express');
const router = express.Router();
const StudyPlan = require('../models/StudyPlan');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Get all study sessions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('User from request:', req.user);
    console.log('User ID:', req.user._id);

    // Find or create study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    console.log('Found study plan:', studyPlan);

    if (!studyPlan) {
      console.log('Creating new study plan for user:', req.user._id);
      studyPlan = new StudyPlan({
        userId: req.user._id,
        title: 'My Study Plan',
        description: 'Weekly study schedule',
        weeklyGoal: 20,
        subjects: [],
        sessions: []
      });
      await studyPlan.save();
      console.log('New study plan created:', studyPlan);
    }
    
    // Fetch all sessions with their associated documents
    const sessionsWithDocuments = await Promise.all(studyPlan.sessions.map(async (session) => {
      // Find documents associated with this session's subject
      const documents = await Note.find({
        userId: req.user._id,
        subject: session.subject
      }).sort({ createdAt: -1 });
      
      // Format document URLs for consistency
      const formattedDocuments = documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        fileUrl: doc.fileUrl ? doc.fileUrl.replace('http://', 'https://') : null,
        type: doc.fileUrl ? doc.fileUrl.split('.').pop() : 'unknown'
      }));
      
      // Return session with its associated documents
      return {
        ...session.toObject(),
        documents: formattedDocuments
      };
    }));
    
    res.json(sessionsWithDocuments);
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single study session by ID
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Find study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    // Find the session by ID
    const session = studyPlan.sessions.find(
      session => session._id.toString() === sessionId
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Fetch associated documents for the session's subject
    const documents = await Note.find({
      userId: req.user._id,
      subject: session.subject
    }).sort({ createdAt: -1 });

    // Format document URLs for consistency
    const formattedDocuments = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      fileUrl: doc.fileUrl ? doc.fileUrl.replace('http://', 'https://') : null,
      type: doc.fileUrl ? doc.fileUrl.split('.').pop() : 'unknown'
    }));

    // Return the session with its associated documents
    res.json({
      ...session.toObject(),
      documents: formattedDocuments
    });
  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new study session
router.post('/', auth, async (req, res) => {
  try {
    const { subject, startTime, endTime, description, documentId } = req.body;
    
    // Validate required fields
    if (!subject || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Verify that the subject exists in the user's notes
    const subjectExists = await Note.findOne({ 
      userId: req.user._id,
      subject: subject
    });

    // If optional documentId is provided, verify it belongs to the subject
    let selectedDocument = null;
    if (documentId) {
      selectedDocument = await Note.findOne({
        _id: documentId,
        userId: req.user._id,
        subject: subject
      });

      if (!selectedDocument) {
        return res.status(400).json({ message: 'Document not found or does not match subject' });
      }
    }

    // Find or create study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      studyPlan = new StudyPlan({
        userId: req.user._id,
        title: 'My Study Plan',
        description: 'Weekly study schedule',
        weeklyGoal: 20,
        subjects: [subject],
        sessions: []
      });
    }

    // Add new session
    const newSession = {
      subject,
      startTime,
      endTime,
      description,
      status: 'scheduled',
      documentId: selectedDocument ? selectedDocument._id : null
    };

    studyPlan.sessions.push(newSession);
    
    // Update subjects list if new subject
    if (!studyPlan.subjects.includes(subject)) {
      studyPlan.subjects.push(subject);
    }

    await studyPlan.save();
    
    // Return session with document info if available
    const sessionResponse = {
      ...newSession,
      document: selectedDocument ? {
        id: selectedDocument._id,
        title: selectedDocument.title,
        fileUrl: selectedDocument.fileUrl ? selectedDocument.fileUrl.replace('http://', 'https://') : null,
        type: selectedDocument.fileUrl ? selectedDocument.fileUrl.split('.').pop() : 'unknown'
      } : null
    };
    
    res.status(201).json(sessionResponse);
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a study session
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { subject, startTime, endTime, description, documentId, progress } = req.body;
    const sessionId = req.params.sessionId;
    
    console.log('Update session request body:', req.body);
    console.log('Extracted fields:', { subject, startTime, endTime, description, documentId, progress });
    
    // Validate required fields (only if updating fields other than progress)
    const isOnlyUpdatingProgress = progress !== undefined && 
      subject === undefined && 
      startTime === undefined && 
      endTime === undefined && 
      description === undefined && 
      documentId === undefined;
    
    console.log('Is only updating progress:', isOnlyUpdatingProgress);
    console.log('Validation check:', !isOnlyUpdatingProgress && (!subject || !startTime || !endTime));
    
    if (!isOnlyUpdatingProgress && (!subject || !startTime || !endTime)) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates (only if updating times)
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // If documentId is provided, verify it belongs to the subject
    let selectedDocument = null;
    if (documentId) {
      selectedDocument = await Note.findOne({
        _id: documentId,
        userId: req.user._id,
        subject: subject
      });

      if (!selectedDocument) {
        return res.status(400).json({ message: 'Document not found or does not match subject' });
      }
    }

    // Find study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    
    console.log('Current study plan sessions:', studyPlan.sessions.map(s => ({
      id: s._id,
      subject: s.subject,
      status: s.status,
      progress: s.progress
    })));

    // Find the session to update
    const sessionIndex = studyPlan.sessions.findIndex(
      session => session._id.toString() === sessionId
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get the current session
    const currentSession = studyPlan.sessions[sessionIndex];
    
    // Update only the specific fields that are provided
    if (subject) currentSession.subject = subject;
    if (startTime) currentSession.startTime = startTime;
    if (endTime) currentSession.endTime = endTime;
    if (description !== undefined) currentSession.description = description;
    if (progress !== undefined) {
      currentSession.progress = progress;
      // Also update status for backward compatibility
      if (progress === 100) {
        currentSession.status = 'completed';
      } else if (progress === 0) {
        currentSession.status = 'scheduled';
      }
    }
    if (selectedDocument) currentSession.documentId = selectedDocument._id;

    // Ensure all required fields are present
    console.log('Updated session before save:', {
      subject: currentSession.subject,
      startTime: currentSession.startTime,
      endTime: currentSession.endTime,
      status: currentSession.status,
      progress: currentSession.progress
    });
    
    // Update subjects list if new subject
    if (subject && !studyPlan.subjects.includes(subject)) {
      studyPlan.subjects.push(subject);
    }

    await studyPlan.save();
    
    console.log('Session updated successfully:', {
      id: currentSession._id,
      subject: currentSession.subject,
      status: currentSession.status,
      progress: currentSession.progress
    });
    
    res.json(currentSession);
  } catch (error) {
    console.error('Error updating study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a study session
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Find study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    // Find the session to delete
    const sessionIndex = studyPlan.sessions.findIndex(
      session => session._id.toString() === sessionId
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Remove session
    studyPlan.sessions.splice(sessionIndex, 1);
    await studyPlan.save();
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a dummy study session for testing
router.post('/create-dummy', auth, async (req, res) => {
  try {
    // Find study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      studyPlan = new StudyPlan({
        userId: req.user._id,
        title: 'My Study Plan',
        description: 'Weekly study schedule',
        weeklyGoal: 20,
        subjects: [],
        sessions: []
      });
    }
    
    // Find available subjects from notes
    const notes = await Note.find({ userId: req.user._id });
    if (!notes || notes.length === 0) {
      return res.status(400).json({ 
        message: 'No subjects available. Please add documents in the Notebook first.' 
      });
    }
    
    // Get unique subjects
    const availableSubjects = [...new Set(notes.map(note => note.subject))];
    console.log('Available subjects for dummy session:', availableSubjects);
    
    // Pick the first subject to create a dummy session
    const subjectForDummy = availableSubjects[0];
    
    // Find documents for this subject
    const subjectDocuments = notes.filter(note => note.subject === subjectForDummy);
    
    if (subjectDocuments.length === 0) {
      return res.status(400).json({ 
        message: `No documents found for subject: ${subjectForDummy}` 
      });
    }
    
    // Create start and end times for the dummy session (today, 1 hour)
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() + 1); // Start 1 hour from now
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // End 1 hour after start
    
    // Create dummy session with reference to the first document
    const dummySession = {
      subject: subjectForDummy,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      description: `Dummy study session for testing with ${subjectForDummy}`,
      status: 'scheduled',
      documentId: subjectDocuments[0]._id
    };
    
    // Add to study plan
    studyPlan.sessions.push(dummySession);
    
    // Update subjects list if new
    if (!studyPlan.subjects.includes(subjectForDummy)) {
      studyPlan.subjects.push(subjectForDummy);
    }
    
    await studyPlan.save();
    
    // Return the created dummy session with its document
    const createdSession = studyPlan.sessions[studyPlan.sessions.length - 1];
    const documentInfo = {
      id: subjectDocuments[0]._id,
      title: subjectDocuments[0].title,
      fileUrl: subjectDocuments[0].fileUrl ? 
        subjectDocuments[0].fileUrl.replace('http://', 'https://') : null,
      type: subjectDocuments[0].fileUrl ? 
        subjectDocuments[0].fileUrl.split('.').pop() : 'unknown'
    };
    
    res.status(201).json({
      session: createdSession,
      document: documentInfo,
      message: `Dummy session created with subject: ${subjectForDummy}`
    });
    
  } catch (error) {
    console.error('Error creating dummy study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 