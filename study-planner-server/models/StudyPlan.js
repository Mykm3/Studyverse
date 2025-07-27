const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

const studyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'My Study Plan'
  },
  description: {
    type: String,
    default: 'Weekly study schedule'
  },
  weeklyGoal: {
    type: Number,
    default: 20 // hours per week
  },
  subjects: [{
    type: String
  }],
  sessions: [studySessionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
studyPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan; 