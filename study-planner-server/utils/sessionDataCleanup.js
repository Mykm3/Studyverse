const { Conversation, Summary, Quiz } = require('../models/SessionData');

class SessionDataCleanup {
  constructor() {
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  // Start automatic cleanup (runs every 24 hours)
  startAutoCleanup() {
    if (this.cleanupInterval) {
      console.log('Cleanup scheduler already running');
      return;
    }

    console.log('Starting session data cleanup scheduler...');
    
    // Run cleanup immediately on start
    this.runCleanup();
    
    // Schedule cleanup every 24 hours (24 * 60 * 60 * 1000 ms)
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 24 * 60 * 60 * 1000);
  }

  // Stop automatic cleanup
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session data cleanup scheduler stopped');
    }
  }

  // Run the cleanup process
  async runCleanup() {
    if (this.isRunning) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('Starting session data cleanup...');
      
      const results = await Promise.all([
        this.cleanupConversations(),
        this.cleanupSummaries(),
        this.cleanupQuizzes()
      ]);

      const [conversationResults, summaryResults, quizResults] = results;
      
      const totalTime = Date.now() - startTime;
      
      console.log('Session data cleanup completed:', {
        conversations: conversationResults,
        summaries: summaryResults,
        quizzes: quizResults,
        duration: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error during session data cleanup:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Clean up old conversations
  async cleanupConversations() {
    try {
      // Delete conversations older than 30 days with no activity
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedOld = await Conversation.deleteMany({
        lastActivity: { $lt: thirtyDaysAgo }
      });

      // Trim conversations with too many messages (keep last 100)
      const longConversations = await Conversation.find({
        messageCount: { $gt: 100 }
      });

      let trimmedCount = 0;
      for (const conv of longConversations) {
        if (conv.messages.length > 100) {
          conv.messages = conv.messages.slice(-100);
          await conv.save();
          trimmedCount++;
        }
      }

      // Delete conversations with no messages
      const deletedEmpty = await Conversation.deleteMany({
        $or: [
          { messages: { $size: 0 } },
          { messageCount: 0 }
        ]
      });

      return {
        deletedOld: deletedOld.deletedCount,
        trimmed: trimmedCount,
        deletedEmpty: deletedEmpty.deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
      return { error: error.message };
    }
  }

  // Clean up old summaries
  async cleanupSummaries() {
    try {
      // Delete summaries not accessed in 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deletedOld = await Summary.deleteMany({
        lastAccessed: { $lt: ninetyDaysAgo }
      });

      // Delete summaries with empty content
      const deletedEmpty = await Summary.deleteMany({
        $or: [
          { summary: '' },
          { summary: { $exists: false } }
        ]
      });

      return {
        deletedOld: deletedOld.deletedCount,
        deletedEmpty: deletedEmpty.deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up summaries:', error);
      return { error: error.message };
    }
  }

  // Clean up old quizzes
  async cleanupQuizzes() {
    try {
      // Delete quizzes not accessed in 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deletedOld = await Quiz.deleteMany({
        lastAccessed: { $lt: ninetyDaysAgo }
      });

      // Delete quizzes with no questions
      const deletedEmpty = await Quiz.deleteMany({
        $or: [
          { questions: { $size: 0 } },
          { questions: { $exists: false } }
        ]
      });

      return {
        deletedOld: deletedOld.deletedCount,
        deletedEmpty: deletedEmpty.deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up quizzes:', error);
      return { error: error.message };
    }
  }

  // Get cleanup statistics
  async getCleanupStats() {
    try {
      const [conversationStats, summaryStats, quizStats] = await Promise.all([
        Conversation.aggregate([
          {
            $group: {
              _id: null,
              totalConversations: { $sum: 1 },
              totalMessages: { $sum: '$messageCount' },
              avgMessagesPerConversation: { $avg: '$messageCount' },
              oldestActivity: { $min: '$lastActivity' },
              newestActivity: { $max: '$lastActivity' }
            }
          }
        ]),
        Summary.aggregate([
          {
            $group: {
              _id: null,
              totalSummaries: { $sum: 1 },
              oldestAccess: { $min: '$lastAccessed' },
              newestAccess: { $max: '$lastAccessed' }
            }
          }
        ]),
        Quiz.aggregate([
          {
            $group: {
              _id: null,
              totalQuizzes: { $sum: 1 },
              totalQuestions: { $sum: { $size: '$questions' } },
              avgQuestionsPerQuiz: { $avg: { $size: '$questions' } },
              oldestAccess: { $min: '$lastAccessed' },
              newestAccess: { $max: '$lastAccessed' }
            }
          }
        ])
      ]);

      return {
        conversations: conversationStats[0] || { totalConversations: 0, totalMessages: 0 },
        summaries: summaryStats[0] || { totalSummaries: 0 },
        quizzes: quizStats[0] || { totalQuizzes: 0, totalQuestions: 0 },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return { error: error.message };
    }
  }
}

// Create singleton instance
const cleanupManager = new SessionDataCleanup();

module.exports = cleanupManager;
