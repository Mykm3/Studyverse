const express = require('express');
const router = express.Router();
const SharedPlan = require('../models/SharedPlan');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a shareable plan from user's current study plan
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, sessions } = req.body;
    
    // Get user info
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If no sessions provided, get from user's current study plan
    let planSessions = sessions;
    if (!planSessions || planSessions.length === 0) {
      const studyPlan = await StudyPlan.findOne({ userId: req.user._id });
      if (!studyPlan || !studyPlan.sessions || studyPlan.sessions.length === 0) {
        return res.status(400).json({ error: 'No study sessions found to share' });
      }
      planSessions = studyPlan.sessions;
    }

    // Generate unique share ID
    let shareId;
    let attempts = 0;
    do {
      shareId = SharedPlan.generateShareId();
      const existing = await SharedPlan.findOne({ shareId });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Failed to generate unique share ID' });
    }

    // Extract subjects and calculate metadata
    const subjects = [...new Set(planSessions.map(s => s.subject))];
    
    // Create shared plan
    const sharedPlan = new SharedPlan({
      shareId,
      ownerId: req.user._id,
      ownerName: user.displayName,
      title: title || 'My Study Plan',
      description: description || 'A shared study schedule',
      planData: {
        subjects,
        sessions: planSessions.map(session => ({
          subject: session.subject,
          startTime: session.startTime,
          endTime: session.endTime,
          description: session.description || '',
          learningStyle: session.learningStyle || 'balanced'
        })),
        weeklyGoal: 20, // Default value
        totalWeeks: Math.ceil(planSessions.length / subjects.length),
        sessionLength: 60, // Default value
        preferredDays: []
      }
    });

    await sharedPlan.save();

    // Generate share URL
    const shareUrl = `${req.protocol}://${req.get('host')}/shared-plan/${shareId}`;

    res.json({
      success: true,
      shareId,
      shareUrl,
      sharedPlan: {
        id: sharedPlan._id,
        shareId: sharedPlan.shareId,
        title: sharedPlan.title,
        description: sharedPlan.description,
        ownerName: sharedPlan.ownerName,
        metadata: sharedPlan.metadata,
        createdAt: sharedPlan.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating shared plan:', error);
    res.status(500).json({ error: 'Failed to create shared plan' });
  }
});

// Get a shared plan by share ID
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const sharedPlan = await SharedPlan.findOne({ shareId }).populate('ownerId', 'displayName');
    
    if (!sharedPlan) {
      return res.status(404).json({ error: 'Shared plan not found' });
    }

    // Check if plan has expired
    if (sharedPlan.expiresAt && new Date() > sharedPlan.expiresAt) {
      return res.status(410).json({ error: 'Shared plan has expired' });
    }

    // Increment access count
    await sharedPlan.incrementAccess();

    res.json({
      success: true,
      sharedPlan: {
        shareId: sharedPlan.shareId,
        title: sharedPlan.title,
        description: sharedPlan.description,
        ownerName: sharedPlan.ownerName,
        planData: sharedPlan.planData,
        metadata: sharedPlan.metadata,
        accessCount: sharedPlan.accessCount,
        createdAt: sharedPlan.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching shared plan:', error);
    res.status(500).json({ error: 'Failed to fetch shared plan' });
  }
});

// Save a shared plan to user's account
router.post('/:shareId/save', auth, async (req, res) => {
  try {
    const { shareId } = req.params;
    const { importMode = 'merge' } = req.body; // 'merge' or 'replace'

    console.log(`[SharedPlan] Saving plan ${shareId} for user ${req.user._id} with mode: ${importMode}`);

    const sharedPlan = await SharedPlan.findOne({ shareId });

    if (!sharedPlan) {
      console.log(`[SharedPlan] Plan not found: ${shareId}`);
      return res.status(404).json({ error: 'Shared plan not found' });
    }

    console.log(`[SharedPlan] Found plan with ${sharedPlan.planData?.subjects?.length || 0} subjects and ${sharedPlan.planData?.sessions?.length || 0} sessions`);

    // Check if plan has expired
    if (sharedPlan.expiresAt && new Date() > sharedPlan.expiresAt) {
      console.log(`[SharedPlan] Plan expired: ${shareId}`);
      return res.status(410).json({ error: 'Shared plan has expired' });
    }

    // Find or create user's study plan
    let studyPlan = await StudyPlan.findOne({ userId: req.user._id });
    if (!studyPlan) {
      console.log(`[SharedPlan] Creating new study plan for user ${req.user._id}`);
      studyPlan = new StudyPlan({
        userId: req.user._id,
        title: 'My Study Plan',
        description: 'Weekly study schedule',
        weeklyGoal: sharedPlan.planData.weeklyGoal || 20,
        subjects: [],
        sessions: []
      });
    } else {
      console.log(`[SharedPlan] Found existing plan with ${studyPlan.sessions?.length || 0} sessions and ${(studyPlan.subjects || []).length} subjects`);
    }

    // Prepare sessions from shared plan
    const newSessions = sharedPlan.planData.sessions.map(session => ({
      subject: session.subject,
      startTime: session.startTime,
      endTime: session.endTime,
      description: session.description ? `${session.description} (imported)` : 'Imported session',
      status: 'scheduled',
      progress: 0,
      isAIGenerated: false
    }));

    // Handle import mode
    let newSubjects = [];

    if (importMode === 'replace') {
      // Replace: Clear existing sessions and subjects, then add new ones
      console.log(`Replacing plan: clearing ${studyPlan.sessions.length} existing sessions and ${(studyPlan.subjects || []).length} subjects`);
      studyPlan.sessions = newSessions;
      studyPlan.subjects = [...sharedPlan.planData.subjects];
      studyPlan.weeklyGoal = sharedPlan.planData.weeklyGoal || studyPlan.weeklyGoal;
      newSubjects = sharedPlan.planData.subjects;
      console.log(`Replaced with ${newSessions.length} new sessions and ${sharedPlan.planData.subjects.length} subjects`);
    } else {
      // Merge: Add new subjects and sessions to existing ones
      // Ensure subjects array exists
      if (!Array.isArray(studyPlan.subjects)) {
        studyPlan.subjects = [];
      }

      newSubjects = sharedPlan.planData.subjects.filter(
        subject => !studyPlan.subjects.includes(subject)
      );
      console.log(`Merging plan: adding ${newSubjects.length} new subjects and ${newSessions.length} new sessions`);
      studyPlan.subjects.push(...newSubjects);
      studyPlan.sessions.push(...newSessions);
    }

    console.log(`[SharedPlan] Saving study plan with ${studyPlan.sessions.length} sessions and ${studyPlan.subjects.length} subjects`);
    await studyPlan.save();
    console.log(`[SharedPlan] Study plan saved successfully`);

    // Auto-create missing subjects as Note placeholders for better UX
    const Note = require('../models/Note');

    // Find subjects that don't exist in user's notes
    const existingNoteSubjects = await Note.distinct('subject', { userId: req.user._id });
    const missingSubjects = sharedPlan.planData.subjects.filter(subject =>
      !existingNoteSubjects.includes(subject)
    );

    console.log(`Creating placeholders for ${missingSubjects.length} missing subjects:`, missingSubjects);

    // Create placeholder notes for missing subjects to make them appear in notebook
    for (const subject of missingSubjects) {
      try {
        // Create a placeholder note to establish the subject in the notebook
        const placeholderNote = new Note({
          userId: req.user._id,
          subject: subject,
          title: `${subject} - Upload your notes here`,
          fileName: 'placeholder-upload-notes.txt',
          fileUrl: '', // Empty URL indicates this is a placeholder
          publicUrl: ''
        });

        await placeholderNote.save();
        console.log(`Created placeholder note for subject: ${subject}`);
      } catch (noteError) {
        console.warn(`Failed to create placeholder note for subject ${subject}:`, noteError);
      }
    }

    res.json({
      success: true,
      message: `Successfully ${importMode === 'replace' ? 'replaced your plan with' : 'imported'} ${newSessions.length} sessions`,
      importedSessions: newSessions.length,
      importedSubjects: newSubjects.length,
      missingSubjects: missingSubjects.length,
      importMode
    });
  } catch (error) {
    console.error('[SharedPlan] Error saving shared plan:', error);
    console.error('[SharedPlan] Error stack:', error.stack);
    console.error('[SharedPlan] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to save shared plan' });
  }
});

// Get user's shared plans
router.get('/user/my-shared-plans', auth, async (req, res) => {
  try {
    const sharedPlans = await SharedPlan.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .select('shareId title description metadata accessCount createdAt expiresAt');

    res.json({
      success: true,
      sharedPlans
    });
  } catch (error) {
    console.error('Error fetching user shared plans:', error);
    res.status(500).json({ error: 'Failed to fetch shared plans' });
  }
});

// Delete a shared plan
router.delete('/:shareId', auth, async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const sharedPlan = await SharedPlan.findOne({ shareId, ownerId: req.user._id });
    
    if (!sharedPlan) {
      return res.status(404).json({ error: 'Shared plan not found or not owned by user' });
    }

    await SharedPlan.deleteOne({ _id: sharedPlan._id });

    res.json({
      success: true,
      message: 'Shared plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shared plan:', error);
    res.status(500).json({ error: 'Failed to delete shared plan' });
  }
});

module.exports = router;
