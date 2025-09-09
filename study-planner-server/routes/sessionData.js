const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Conversation, Summary, Quiz } = require('../models/SessionData');
const crypto = require('crypto');

// Utility function to create hash of extracted text
const createTextHash = (text) => {
  return crypto.createHash('md5').update(text || '').digest('hex');
};

// ==================== CONVERSATION ROUTES ====================

// Get conversation history for a session
router.get('/conversation/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    console.log('🔍 [SessionData] GET conversation request:');
    console.log('   Session ID:', sessionId);
    console.log('   User ID:', req.user._id);
    console.log('   Page:', page, 'Limit:', limit);

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });

    console.log('📊 [SessionData] Conversation query result:', conversation ? 'Found' : 'Not found');

    if (!conversation) {
      const response = {
        messages: [],
        totalMessages: 0,
        hasMore: false
      };
      console.log('📤 [SessionData] Sending empty conversation response:', response);
      return res.json(response);
    }

    // Pagination for messages (most recent first)
    const startIndex = Math.max(0, conversation.messages.length - (page * limit));
    const endIndex = conversation.messages.length - ((page - 1) * limit);
    const paginatedMessages = conversation.messages.slice(startIndex, endIndex);

    const response = {
      messages: paginatedMessages,
      totalMessages: conversation.messageCount,
      hasMore: startIndex > 0,
      subject: conversation.subject
    };

    console.log('📤 [SessionData] Sending conversation response:');
    console.log('   Messages count:', paginatedMessages.length);
    console.log('   Total messages:', conversation.messageCount);
    console.log('   Has more:', startIndex > 0);

    res.json(response);
  } catch (error) {
    console.error('❌ [SessionData] Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/update conversation
router.post('/conversation/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messages, subject, documentId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }
    
    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ message: 'Invalid message format' });
      }
    }
    
    let conversation = await Conversation.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });
    
    if (conversation) {
      // Update existing conversation
      conversation.messages = messages.slice(-100); // Keep only last 100 messages
      conversation.subject = subject || conversation.subject;
      conversation.documentId = documentId || conversation.documentId;
    } else {
      // Create new conversation
      conversation = new Conversation({
        userId: req.user._id,
        sessionId: sessionId,
        subject: subject || 'Study Session',
        documentId: documentId,
        messages: messages.slice(-100)
      });
    }
    
    await conversation.save();
    
    res.json({
      success: true,
      messageCount: conversation.messageCount,
      lastActivity: conversation.lastActivity
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add single message to conversation
router.post('/conversation/:sessionId/message', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content, subject, documentId } = req.body;
    
    if (!role || !content || !['user', 'assistant'].includes(role)) {
      return res.status(400).json({ message: 'Valid role and content are required' });
    }
    
    let conversation = await Conversation.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });
    
    const newMessage = {
      role,
      content,
      timestamp: new Date()
    };
    
    if (conversation) {
      conversation.messages.push(newMessage);
      // Auto-trim if exceeding limit
      if (conversation.messages.length > 100) {
        conversation.messages = conversation.messages.slice(-100);
      }
    } else {
      conversation = new Conversation({
        userId: req.user._id,
        sessionId: sessionId,
        subject: subject || 'Study Session',
        documentId: documentId,
        messages: [newMessage]
      });
    }
    
    await conversation.save();
    
    res.json({
      success: true,
      message: newMessage,
      messageCount: conversation.messageCount
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SUMMARY ROUTES ====================

// Get summary for a session
router.get('/summary/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 [SessionData] GET summary request:');
    console.log('   Session ID:', sessionId);
    console.log('   User ID:', req.user._id);

    const summary = await Summary.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });

    console.log('📊 [SessionData] Summary query result:', summary ? 'Found' : 'Not found');

    if (!summary) {
      const response = { summary: null };
      console.log('📤 [SessionData] Sending empty summary response:', response);
      return res.json(response);
    }

    // Update last accessed time
    summary.lastAccessed = new Date();
    await summary.save();

    const response = {
      summary: summary.summary,
      createdAt: summary.createdAt,
      subject: summary.subject
    };

    console.log('📤 [SessionData] Sending summary response:');
    console.log('   Summary length:', summary.summary?.length || 0);
    console.log('   Subject:', summary.subject);

    res.json(response);
  } catch (error) {
    console.error('❌ [SessionData] Error fetching summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/update summary
router.post('/summary/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { summary, subject, documentId, extractedText } = req.body;
    
    if (!summary) {
      return res.status(400).json({ message: 'Summary content is required' });
    }
    
    const textHash = createTextHash(extractedText);
    
    let existingSummary = await Summary.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });
    
    if (existingSummary) {
      existingSummary.summary = summary;
      existingSummary.extractedTextHash = textHash;
      existingSummary.subject = subject || existingSummary.subject;
      existingSummary.documentId = documentId || existingSummary.documentId;
      await existingSummary.save();
    } else {
      existingSummary = new Summary({
        userId: req.user._id,
        sessionId: sessionId,
        subject: subject || 'Study Session',
        documentId: documentId,
        summary: summary,
        extractedTextHash: textHash
      });
      await existingSummary.save();
    }
    
    res.json({
      success: true,
      createdAt: existingSummary.createdAt
    });
  } catch (error) {
    console.error('Error saving summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== QUIZ ROUTES ====================

// Get quiz for a session
router.get('/quiz/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 [SessionData] GET quiz request:');
    console.log('   Session ID:', sessionId);
    console.log('   User ID:', req.user._id);

    const quiz = await Quiz.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });

    console.log('📊 [SessionData] Quiz query result:', quiz ? 'Found' : 'Not found');

    if (!quiz) {
      const response = { quiz: null };
      console.log('📤 [SessionData] Sending empty quiz response:', response);
      return res.json(response);
    }

    // Update last accessed time
    quiz.lastAccessed = new Date();
    await quiz.save();

    const response = {
      questions: quiz.questions,
      userAnswers: quiz.userAnswers,
      score: quiz.score,
      completed: quiz.completed,
      createdAt: quiz.createdAt,
      subject: quiz.subject
    };

    console.log('📤 [SessionData] Sending quiz response:');
    console.log('   Questions count:', quiz.questions?.length || 0);
    console.log('   User answers count:', quiz.userAnswers?.length || 0);
    console.log('   Completed:', quiz.completed);

    res.json(response);
  } catch (error) {
    console.error('❌ [SessionData] Error fetching quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/update quiz
router.post('/quiz/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questions, subject, documentId, extractedText } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Questions array is required' });
    }
    
    const textHash = createTextHash(extractedText);
    
    let existingQuiz = await Quiz.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });
    
    if (existingQuiz) {
      existingQuiz.questions = questions.slice(0, 20); // Limit to 20 questions
      existingQuiz.extractedTextHash = textHash;
      existingQuiz.subject = subject || existingQuiz.subject;
      existingQuiz.documentId = documentId || existingQuiz.documentId;
      existingQuiz.userAnswers = []; // Reset answers when quiz is regenerated
      existingQuiz.completed = false;
      existingQuiz.score = { correct: 0, total: 0 };
      await existingQuiz.save();
    } else {
      existingQuiz = new Quiz({
        userId: req.user._id,
        sessionId: sessionId,
        subject: subject || 'Study Session',
        documentId: documentId,
        questions: questions.slice(0, 20),
        extractedTextHash: textHash
      });
      await existingQuiz.save();
    }
    
    res.json({
      success: true,
      questionCount: existingQuiz.questions.length,
      createdAt: existingQuiz.createdAt
    });
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quiz answers and score
router.put('/quiz/:sessionId/answers', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswers, score, completed } = req.body;
    
    const quiz = await Quiz.findOne({
      userId: req.user._id,
      sessionId: sessionId
    });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    quiz.userAnswers = userAnswers || [];
    quiz.score = score || quiz.score;
    quiz.completed = completed !== undefined ? completed : quiz.completed;
    
    await quiz.save();
    
    res.json({
      success: true,
      score: quiz.score,
      completed: quiz.completed
    });
  } catch (error) {
    console.error('Error updating quiz answers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLEANUP ROUTES ====================

// Manual cleanup endpoint (admin use)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    const results = {};

    if (type === 'all' || type === 'conversations') {
      const deletedConversations = await Conversation.cleanupOldConversations();
      const trimmedConversations = await Conversation.trimLongConversations();
      results.conversations = {
        deleted: deletedConversations.deletedCount,
        trimmed: trimmedConversations
      };
    }

    if (type === 'all' || type === 'summaries') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deletedSummaries = await Summary.deleteMany({
        lastAccessed: { $lt: ninetyDaysAgo }
      });
      results.summaries = { deleted: deletedSummaries.deletedCount };
    }

    if (type === 'all' || type === 'quizzes') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deletedQuizzes = await Quiz.deleteMany({
        lastAccessed: { $lt: ninetyDaysAgo }
      });
      results.quizzes = { deleted: deletedQuizzes.deletedCount };
    }

    res.json({
      success: true,
      cleanup: results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: 'Cleanup failed' });
  }
});

// Get storage statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [conversationStats, summaryStats, quizStats] = await Promise.all([
      Conversation.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: '$messageCount' },
            avgMessagesPerConversation: { $avg: '$messageCount' }
          }
        }
      ]),
      Summary.countDocuments({ userId }),
      Quiz.countDocuments({ userId })
    ]);

    res.json({
      conversations: conversationStats[0] || { totalConversations: 0, totalMessages: 0, avgMessagesPerConversation: 0 },
      summaries: summaryStats,
      quizzes: quizStats,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
