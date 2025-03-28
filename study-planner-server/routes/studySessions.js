const express = require('express');
const router = express.Router();
const StudyPlan = require('../models/StudyPlan');
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
    res.json(studyPlan.sessions);
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new study session
router.post('/', auth, async (req, res) => {
  try {
    const { subject, startTime, endTime, description } = req.body;
    
    // Validate required fields
    if (!subject || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
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
      status: 'scheduled'
    };

    studyPlan.sessions.push(newSession);
    
    // Update subjects list if new subject
    if (!studyPlan.subjects.includes(subject)) {
      studyPlan.subjects.push(subject);
    }

    await studyPlan.save();
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 