const mongoose = require('mongoose');

// Schema for individual chat messages
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000 // Limit message length to prevent bloat
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // No need for individual message IDs

// Schema for chat conversations per session
const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    index: true
  },
  messages: {
    type: [messageSchema],
    validate: {
      validator: function(messages) {
        return messages.length <= 100; // Limit to 100 messages per session
      },
      message: 'Maximum 100 messages per session allowed'
    }
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days (30 * 24 * 60 * 60)
  }
});

// Schema for session summaries
const summarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    index: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 5000 // Limit summary length
  },
  extractedTextHash: {
    type: String, // Hash of the extracted text to detect if document changed
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // Auto-delete after 90 days (90 * 24 * 60 * 60)
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Schema for quiz questions
const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    maxlength: 500
  },
  options: [{
    type: String,
    maxlength: 200
  }],
  answer: {
    type: String,
    required: true,
    maxlength: 200
  }
}, { _id: false });

// Schema for session quizzes
const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    index: true
  },
  questions: {
    type: [quizQuestionSchema],
    validate: {
      validator: function(questions) {
        return questions.length <= 20; // Limit to 20 questions per quiz
      },
      message: 'Maximum 20 questions per quiz allowed'
    }
  },
  userAnswers: [{
    type: Number // Index of selected answer
  }],
  score: {
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  completed: {
    type: Boolean,
    default: false
  },
  extractedTextHash: {
    type: String, // Hash of the extracted text to detect if document changed
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // Auto-delete after 90 days (90 * 24 * 60 * 60)
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
conversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
conversationSchema.index({ userId: 1, subject: 1, lastActivity: -1 });
conversationSchema.index({ createdAt: 1 }); // For cleanup operations

summarySchema.index({ userId: 1, sessionId: 1 }, { unique: true });
summarySchema.index({ userId: 1, subject: 1, createdAt: -1 });
summarySchema.index({ extractedTextHash: 1 });

quizSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
quizSchema.index({ userId: 1, subject: 1, createdAt: -1 });
quizSchema.index({ extractedTextHash: 1 });

// Pre-save middleware to update message count and last activity
conversationSchema.pre('save', function(next) {
  this.messageCount = this.messages.length;
  this.lastActivity = new Date();
  
  // Trim messages if exceeding limit (keep most recent)
  if (this.messages.length > 100) {
    this.messages = this.messages.slice(-100);
    this.messageCount = 100;
  }
  
  next();
});

// Pre-save middleware to update last accessed time
summarySchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

quizSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

// Static methods for cleanup operations
conversationSchema.statics.cleanupOldConversations = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({ lastActivity: { $lt: thirtyDaysAgo } });
};

conversationSchema.statics.trimLongConversations = async function() {
  const conversations = await this.find({ messageCount: { $gt: 100 } });
  
  for (const conv of conversations) {
    conv.messages = conv.messages.slice(-100);
    await conv.save();
  }
  
  return conversations.length;
};

// Create models
const Conversation = mongoose.model('Conversation', conversationSchema);
const Summary = mongoose.model('Summary', summarySchema);
const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = {
  Conversation,
  Summary,
  Quiz
};
