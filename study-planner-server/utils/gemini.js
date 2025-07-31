const { GoogleGenerativeAI } = require("@google/generative-ai");
const { recordModelUsage } = require('./model-stats');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Dynamically selects the best Gemini model based on the task
 * @param {string} task - e.g., 'chat', 'summary', 'quiz', 'schedule'
 * @param {string} prompt - user input or instruction
 * @param {object} options - generation options
 * @returns {Promise<string>} - AI response
 */
async function runGeminiTask(task, prompt, options = {}) {
  let modelName;

  // 🔄 Switch model based on task complexity
  switch (task) {
    case "chat":
      modelName = "gemini-2.5-pro"; // Deep reasoning for chatbot
      break;
    case "summary":
    case "quiz":
      modelName = "gemini-2.5-pro"; // Using Pro for better quality summaries and quizzes
      break;
    case "schedule":
    case "studyplan":
      modelName = "gemini-2.5-pro"; // More reasoning required for time planning
      break;
    default:
      modelName = "gemini-2.5-flash"; // Safe fallback
  }

  console.log(`Using Gemini model: ${modelName} for task: ${task}`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: options.temperature || 0.2,
      maxOutputTokens: options.maxTokens || 1000,
      topP: 0.8,
      topK: 40,
    }
  });

  try {
    const startTime = Date.now();
    console.log(`Sending request to Gemini ${modelName}...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const endTime = Date.now();
    
    // Check if response is empty or null
    if (!response || !response.text) {
      console.error(`Gemini ${modelName} returned empty or null response`);
      throw new Error(`Gemini API returned empty response for model ${modelName}`);
    }
    
    const responseText = response.text();
    
    // Check if response text is empty
    if (!responseText || responseText.trim().length === 0) {
      console.error(`Gemini ${modelName} returned empty text response`);
      throw new Error(`Gemini API returned empty text response for model ${modelName}`);
    }
    
    // Record usage statistics
    const timeMs = endTime - startTime;
    const tokens = responseText.length; // Approximate token count
    recordModelUsage(modelName, task, tokens, timeMs);
    
    console.log(`Gemini ${modelName} response received:`, {
      length: responseText.length,
      preview: responseText.substring(0, 100) + '...',
      timeMs
    });
    
    return responseText;
  } catch (error) {
    console.error(`Gemini API Error for ${modelName}:`, {
      message: error.message,
      stack: error.stack,
      task,
      promptLength: prompt.length
    });
    throw new Error(`Gemini API error for model ${modelName}: ${error.message}`);
  }
}

// Legacy function for backward compatibility
async function generateFromGemini(prompt, options = {}) {
  return runGeminiTask("default", prompt, options);
}

module.exports = {
  generateFromGemini,
  runGeminiTask
}; 