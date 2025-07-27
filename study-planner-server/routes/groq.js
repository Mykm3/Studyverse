const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

// Debug logging for Groq configuration
console.log('Groq configuration:');
console.log('GROQ_API_KEY:', GROQ_API_KEY ? 'Present' : 'Missing');
console.log('GROQ_API_URL:', GROQ_API_URL);
console.log('MODEL:', MODEL);

// Helper function to truncate text to fit within token limits
const truncateText = (text, maxWords = 8000) => {
  if (!text) return '';
  
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  
  // Take the first maxWords words and add ellipsis
  const truncated = words.slice(0, maxWords).join(' ');
  return truncated + '... [Content truncated due to length]';
};

// Helper function to extract the most relevant parts of text
const extractRelevantText = (text, maxWords = 8000) => {
  if (!text) return '';
  
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  
  // For now, take the first portion, but we could implement smarter selection
  // like taking sections with more keywords, headings, etc.
  const truncated = words.slice(0, maxWords).join(' ');
  return truncated + '... [Content truncated due to length]';
};

// Summary endpoint
router.post('/summary', async (req, res) => {
  const { text } = req.body;
  
  // Check if API key is available
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is missing');
    return res.status(500).json({ error: 'Groq API key not configured' });
  }
  
  // Truncate text to prevent token limit issues
  const truncatedText = truncateText(text, 8000);
  console.log(`Original text length: ${text?.split(/\s+/).length || 0} words`);
  console.log(`Truncated text length: ${truncatedText.split(/\s+/).length} words`);
  
  const prompt = [
    { role: 'system', content: 'You summarize academic slides for students clearly and concisely.' },
    { role: 'user', content: `Summarize this academic content:\n${truncatedText}` }
  ];
  
  try {
    console.log('Making Groq API request for summary...');
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages: prompt },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    console.log('Groq API response received for summary');
    res.json(groqRes.data);
  } catch (err) {
    console.error('Groq API error for summary:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Quiz endpoint
router.post('/quiz', async (req, res) => {
  const { text } = req.body;
  
  // Check if API key is available
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is missing');
    return res.status(500).json({ error: 'Groq API key not configured' });
  }
  
  // Truncate text to prevent token limit issues (use fewer words for quiz to leave room for response)
  const truncatedText = truncateText(text, 6000);
  console.log(`Original text length: ${text?.split(/\s+/).length || 0} words`);
  console.log(`Truncated text length: ${truncatedText.split(/\s+/).length} words`);
  
  const prompt = [
    { role: 'system', content: 'You create multiple-choice quizzes from study materials. Respond ONLY with a single JSON array containing 5-10 objects, each with: question, options (array), answer (string). No explanations, no Markdown, no extra text.' },
    { role: 'user', content: `Create a 5-10 question quiz (with answers) from this:\n${truncatedText}\nRespond ONLY with a single JSON array, no explanations, no Markdown, no extra text.` }
  ];
  
  try {
    console.log('Making Groq API request for quiz...');
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages: prompt },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    console.log('Groq API response received for quiz');
    res.json(groqRes.data);
  } catch (err) {
    console.error('Groq API error for quiz:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  
  // Check if API key is available
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is missing');
    return res.status(500).json({ error: 'Groq API key not configured' });
  }
  
  try {
    console.log('Making Groq API request for chat...');
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    console.log('Groq API response received for chat');
    res.json(groqRes.data);
  } catch (err) {
    console.error('Groq API error for chat:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router; 