const mongoose = require('mongoose');

const sharedPlanSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Shared Study Plan'
  },
  description: {
    type: String,
    default: 'A shared study schedule'
  },
  planData: {
    subjects: [{
      type: String,
      required: true
    }],
    sessions: [{
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
      learningStyle: {
        type: String,
        default: 'balanced'
      }
    }],
    weeklyGoal: {
      type: Number,
      default: 20
    },
    totalWeeks: {
      type: Number,
      default: 1
    },
    sessionLength: {
      type: Number,
      default: 60
    },
    preferredDays: [{
      type: String
    }]
  },
  metadata: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    subjectCount: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from creation
  }
});

// Index for efficient querying
sharedPlanSchema.index({ shareId: 1 });
sharedPlanSchema.index({ ownerId: 1 });
sharedPlanSchema.index({ createdAt: -1 });
sharedPlanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired plans

// Pre-save middleware to calculate metadata
sharedPlanSchema.pre('save', function(next) {
  if (this.planData && this.planData.sessions) {
    this.metadata.totalSessions = this.planData.sessions.length;
    this.metadata.subjectCount = [...new Set(this.planData.sessions.map(s => s.subject))].length;
    
    // Calculate total hours
    this.metadata.totalHours = this.planData.sessions.reduce((total, session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return total + (end - start) / (1000 * 60 * 60); // Convert to hours
    }, 0);
  }
  next();
});

// Method to increment access count
sharedPlanSchema.methods.incrementAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to generate unique share ID
sharedPlanSchema.statics.generateShareId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const SharedPlan = mongoose.model('SharedPlan', sharedPlanSchema);

module.exports = SharedPlan;
