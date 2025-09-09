const mongoose = require('mongoose');
const { Conversation, Summary, Quiz } = require('./models/SessionData');
require('dotenv').config();

// Test data
const testUserId = new mongoose.Types.ObjectId();
const testSessionId = new mongoose.Types.ObjectId();
const testDocumentId = new mongoose.Types.ObjectId();

async function testSessionDataModels() {
  try {
    console.log('🧪 Testing Session Data Models...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create and save a conversation
    console.log('📝 Test 1: Creating conversation...');
    const conversation = new Conversation({
      userId: testUserId,
      sessionId: testSessionId,
      subject: 'Test Subject',
      documentId: testDocumentId,
      messages: [
        {
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: new Date()
        },
        {
          role: 'user',
          content: 'Can you explain this topic?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'Sure! Let me explain...',
          timestamp: new Date()
        }
      ]
    });

    await conversation.save();
    console.log('✅ Conversation saved successfully');
    console.log(`   - Messages: ${conversation.messageCount}`);
    console.log(`   - Last Activity: ${conversation.lastActivity}\n`);

    // Test 2: Create and save a summary
    console.log('📄 Test 2: Creating summary...');
    const summary = new Summary({
      userId: testUserId,
      sessionId: testSessionId,
      subject: 'Test Subject',
      documentId: testDocumentId,
      summary: 'This is a test summary of the document content. It covers the main topics and key points.',
      extractedTextHash: 'test-hash-123'
    });

    await summary.save();
    console.log('✅ Summary saved successfully');
    console.log(`   - Length: ${summary.summary.length} characters`);
    console.log(`   - Created: ${summary.createdAt}\n`);

    // Test 3: Create and save a quiz
    console.log('❓ Test 3: Creating quiz...');
    const quiz = new Quiz({
      userId: testUserId,
      sessionId: testSessionId,
      subject: 'Test Subject',
      documentId: testDocumentId,
      questions: [
        {
          question: 'What is the main topic of this document?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer: 'Option A'
        },
        {
          question: 'Which concept is most important?',
          options: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'],
          answer: 'Concept 2'
        }
      ],
      extractedTextHash: 'test-hash-123'
    });

    await quiz.save();
    console.log('✅ Quiz saved successfully');
    console.log(`   - Questions: ${quiz.questions.length}`);
    console.log(`   - Created: ${quiz.createdAt}\n`);

    // Test 4: Test retrieval
    console.log('🔍 Test 4: Testing retrieval...');
    
    const foundConversation = await Conversation.findOne({ 
      userId: testUserId, 
      sessionId: testSessionId 
    });
    console.log(`✅ Found conversation with ${foundConversation.messageCount} messages`);

    const foundSummary = await Summary.findOne({ 
      userId: testUserId, 
      sessionId: testSessionId 
    });
    console.log(`✅ Found summary: ${foundSummary.summary.substring(0, 50)}...`);

    const foundQuiz = await Quiz.findOne({ 
      userId: testUserId, 
      sessionId: testSessionId 
    });
    console.log(`✅ Found quiz with ${foundQuiz.questions.length} questions\n`);

    // Test 5: Test message limit enforcement
    console.log('⚡ Test 5: Testing message limits...');

    // Add many messages to test the 100-message limit
    const manyMessages = [];
    for (let i = 0; i < 105; i++) {
      manyMessages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Test message ${i + 1}`,
        timestamp: new Date()
      });
    }

    try {
      foundConversation.messages = manyMessages;
      await foundConversation.save();
      console.log('❌ Expected validation error for too many messages');
    } catch (validationError) {
      console.log('✅ Message limit validation working correctly');
      console.log(`   - Rejected ${manyMessages.length} messages (limit is 100)`);

      // Test the pre-save middleware that should trim messages
      foundConversation.messages = manyMessages.slice(0, 100); // Exactly 100 messages
      await foundConversation.save();
      console.log(`✅ Saved exactly 100 messages: ${foundConversation.messageCount}\n`);
    }

    // Test 6: Test cleanup functionality
    console.log('🧹 Test 6: Testing cleanup...');
    
    const cleanupResults = await Conversation.cleanupOldConversations();
    console.log(`✅ Cleanup completed: ${cleanupResults.deletedCount} old conversations deleted`);

    const trimResults = await Conversation.trimLongConversations();
    console.log(`✅ Trimming completed: ${trimResults} conversations trimmed\n`);

    // Test 7: Test aggregation queries
    console.log('📊 Test 7: Testing statistics...');
    
    const stats = await Conversation.aggregate([
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: '$messageCount' },
          avgMessagesPerConversation: { $avg: '$messageCount' }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log(`✅ Statistics calculated:`);
      console.log(`   - Total conversations: ${stats[0].totalConversations}`);
      console.log(`   - Total messages: ${stats[0].totalMessages}`);
      console.log(`   - Average messages per conversation: ${stats[0].avgMessagesPerConversation.toFixed(2)}\n`);
    }

    // Cleanup test data
    console.log('🗑️  Cleaning up test data...');
    await Conversation.deleteMany({ userId: testUserId });
    await Summary.deleteMany({ userId: testUserId });
    await Quiz.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the tests
if (require.main === module) {
  testSessionDataModels();
}

module.exports = testSessionDataModels;
