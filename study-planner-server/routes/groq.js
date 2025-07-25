const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

// Summary endpoint
router.post('/summary', async (req, res) => {
  const { text } = req.body;
  const prompt = [
    { role: 'system', content: 'You summarize academic slides for students clearly and concisely.' },
    { role: 'user', content: `Summarize this academic content:\n${text}` }
  ];
  try {
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages: prompt },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    res.json(groqRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Quiz endpoint
router.post('/quiz', async (req, res) => {
  const { text } = req.body;
  const prompt = [
    { role: 'system', content: 'You create multiple-choice quizzes from study materials. Respond ONLY with a single JSON array containing 5-10 objects, each with: question, options (array), answer (string). No explanations, no Markdown, no extra text.' },
    { role: 'user', content: `Create a 5-10 question quiz (with answers) from this:\n${text}\nRespond ONLY with a single JSON array, no explanations, no Markdown, no extra text.` }
  ];
  try {
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages: prompt },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    res.json(groqRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const groqRes = await axios.post(
      GROQ_API_URL,
      { model: MODEL, messages },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    res.json(groqRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router; 