const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

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
router.post('/summary', auth, async (req, res) => {
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
router.post('/quiz', auth, async (req, res) => {
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
router.post('/chat', auth, async (req, res) => {
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

// Generate AI Study Plan
router.post("/studyplan", auth, async (req, res) => {
  try {
    const { 
      subjects, 
      hours, 
      preference, 
      weeks, 
      goals, 
      sessionLength,
      breakLength,
      preferredDays,
      focusAreas,
      examDates
    } = req.body;

    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Validate required fields
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }

    if (!hours || hours < 1 || hours > 40) {
      return res.status(400).json({ error: 'Weekly hours must be between 1 and 40' });
    }

    if (!weeks || weeks < 1 || weeks > 52) {
      return res.status(400).json({ error: 'Weeks must be between 1 and 52' });
    }

    // Limit weeks to prevent oversized responses
    const maxWeeks = Math.min(weeks, 8); // Cap at 8 weeks maximum
    
    // Create the AI prompt
    const prompt = [
      {
        role: "system",
        content: `Create study schedules. Return ONLY valid JSON, no explanations, no extra text:

{
  "weeks": [
    {
      "weekNumber": 1,
      "sessions": [
        {
          "subject": "EXACT_SUBJECT_NAME",
          "startTime": "2025-01-27T09:00:00.000Z",
          "endTime": "2025-01-27T10:30:00.000Z",
          "description": "Brief session description",
          "learningStyle": "balanced"
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- Use EXACT subject names from: ${subjects.join(", ")}
- NO "Introduction to" or other prefixes
- Keep descriptions brief (max 30 characters)
- ${sessionLength || 60}min sessions, ${breakLength || 15}min breaks
- ${preferredDays ? preferredDays.join(', ') : 'any'} days only
- ${preference} time preference
- Limit to ${maxWeeks} weeks maximum
- Keep response under 3000 characters total
- NO extra text before or after JSON`
      },
      {
        role: "user",
        content: `Generate ${maxWeeks} weeks study plan for: ${subjects.join(", ")}. ${hours}h/week, ${preference} time, ${sessionLength || 60}min sessions. Start: ${new Date().toISOString().split('T')[0]}. Return ONLY JSON.`
      }
    ];

    console.log('Sending study plan request to Groq:', {
      subjects,
      hours,
      preference,
      sessionLength,
      breakLength,
      preferredDays,
      requestedWeeks: weeks,
      maxWeeks,
      focusAreas,
      hasGoals: !!goals,
      hasExamDates: !!examDates
    });

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama3-70b-8192",
      messages: prompt,
      temperature: 0.3,
      max_tokens: 4000
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const message = response.data.choices[0].message.content;
    console.log('Raw AI response length:', message.length);
    
    // Check if response is too large
    if (message.length > 5000) {
      console.warn('AI response is very large:', message.length, 'characters');
    }
    
    console.log('Raw AI response (first 500 chars):', message.substring(0, 500));
    console.log('Raw AI response (last 500 chars):', message.substring(Math.max(0, message.length - 500)));

    // Try to parse the JSON response
    let plan;
    
    // Validate response size
    if (message.length > 10000) {
      console.error('AI response too large:', message.length, 'characters');
      return res.status(500).json({ 
        error: 'AI response too large - please reduce the number of weeks or subjects',
        responseLength: message.length,
        maxAllowed: 10000
      });
    }
    
    try {
      // First try to parse the entire message as JSON (most common case)
      plan = JSON.parse(message.trim());
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying regex extraction...');
      try {
        // If direct parse fails, try to extract JSON using regex
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (regexParseError) {
        console.log('Regex extraction failed, trying to fix truncated JSON...');
        try {
          // Try to fix truncated JSON by finding the last complete object
          const lastCompleteMatch = message.match(/\{[\s\S]*?"weeks"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/);
          if (lastCompleteMatch) {
            plan = JSON.parse(lastCompleteMatch[0]);
          } else {
            // Try to extract just the weeks array if the outer object is truncated
            const weeksMatch = message.match(/"weeks"\s*:\s*\[[\s\S]*?\][\s\S]*?$/);
            if (weeksMatch) {
              const weeksJson = `{"weeks": ${weeksMatch[0].replace(/^"weeks"\s*:\s*/, '')}}`;
              plan = JSON.parse(weeksJson);
            } else {
              throw new Error('Could not extract valid JSON from truncated response');
            }
          }
        } catch (fixError) {
          console.error('Failed to parse AI response:', parseError);
          console.error('Raw response length:', message.length);
          console.error('Raw response (first 1000 chars):', message.substring(0, 1000));
          console.error('Raw response (last 1000 chars):', message.substring(Math.max(0, message.length - 1000)));
          return res.status(500).json({ 
            error: 'Failed to parse AI response - response may be truncated',
            rawResponse: message.substring(0, 2000) + '...',
            responseLength: message.length
          });
        }
      }
    }

    console.log('Successfully generated study plan:', {
      weeksCount: plan.weeks?.length || 0,
      totalSessions: plan.weeks?.reduce((sum, week) => sum + (week.sessions?.length || 0), 0) || 0
    });

    res.json({ 
      success: true,
      plan,
      message: 'Study plan generated successfully'
    });

  } catch (error) {
    console.error('Study Plan Generation Failed:', error);
    
    if (error.response) {
      console.error('Groq API Error:', error.response.data);
      res.status(500).json({ 
        error: 'AI service error',
        details: error.response.data 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate study plan',
        details: error.message 
      });
    }
  }
});

module.exports = router; 