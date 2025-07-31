require('dotenv').config();
const { runGeminiTask } = require('./utils/gemini');

async function testGemini() {
  try {
    console.log('Testing Gemini integration...');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    const testPrompt = 'Generate a simple study plan for one week with 2 sessions for "Mathematics". Return only valid JSON with this format: {"weeks":[{"weekNumber":1,"sessions":[{"subject":"Mathematics","startTime":"2025-01-27T09:00:00.000Z","endTime":"2025-01-27T10:00:00.000Z","learningStyle":"balanced"}]}]}';
    
    console.log('Sending test prompt to Gemini...');
    const response = await runGeminiTask("studyplan", testPrompt, { maxTokens: 300 });
    
    console.log('✅ Gemini response received:');
    console.log('Response length:', response.length, 'characters');
    console.log('Response preview:', response.substring(0, 200) + '...');
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Response is valid JSON');
      console.log('Weeks count:', parsed.weeks?.length || 0);
      console.log('Sessions count:', parsed.weeks?.[0]?.sessions?.length || 0);
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON, but that\'s okay for testing');
    }
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
  }
}

testGemini(); 