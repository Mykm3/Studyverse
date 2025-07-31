require('dotenv').config();
const { runGeminiTask } = require('./utils/gemini');

async function testAllModels() {
  try {
    console.log('🧪 Testing all Gemini models for different tasks...');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    const tests = [
      {
        task: 'summary',
        prompt: 'Summarize this academic content: Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.',
        expectedModel: 'gemini-2.5-pro'
      },
      {
        task: 'quiz',
        prompt: 'Create a quiz from this: Machine learning uses algorithms to find patterns in data. Return only JSON array with question, options, answer.',
        expectedModel: 'gemini-2.5-pro'
      },
      {
        task: 'chat',
        prompt: 'You are a helpful academic assistant. A student asks: "What is the difference between supervised and unsupervised learning?"',
        expectedModel: 'gemini-2.5-pro'
      },
      {
        task: 'studyplan',
        prompt: 'Generate a study plan for week 1 with 2 sessions for "Mathematics". Return only valid JSON.',
        expectedModel: 'gemini-2.5-pro'
      }
    ];
    
    for (const test of tests) {
      console.log(`\n📋 Testing ${test.task} task (expected model: ${test.expectedModel})...`);
      
      try {
        const startTime = Date.now();
        const response = await runGeminiTask(test.task, test.prompt, { maxTokens: 300 });
        const endTime = Date.now();
        
        console.log(`✅ ${test.task} task completed in ${endTime - startTime}ms`);
        console.log(`📝 Response length: ${response.length} characters`);
        console.log(`👀 Preview: ${response.substring(0, 100)}...`);
        
        // Try to parse as JSON for structured responses
        if (test.task === 'quiz' || test.task === 'studyplan') {
          try {
            const parsed = JSON.parse(response);
            console.log(`✅ Response is valid JSON`);
          } catch (parseError) {
            console.log(`⚠️ Response is not valid JSON (expected for ${test.task})`);
          }
        }
        
      } catch (error) {
        console.error(`❌ ${test.task} task failed:`, error.message);
      }
    }
    
    console.log('\n🎉 All model tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testAllModels(); 