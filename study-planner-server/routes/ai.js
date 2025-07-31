const express = require('express');
const { runGeminiTask } = require('../utils/gemini');
const { getModelStats, logModelStats } = require('../utils/model-stats');
const auth = require('../middleware/auth');
const router = express.Router();

// Debug logging for Gemini configuration
console.log('Gemini configuration:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

// Summary endpoint
router.post('/summary', auth, async (req, res) => {
  const { text } = req.body;
  
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing');
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }
  
  try {
    console.log('Making Gemini API request for summary...');
    
    const prompt = `Summarize this academic content clearly and concisely for students:

${text}

Provide a clear, structured summary that highlights the key points.`;

    const summary = await runGeminiTask("summary", prompt, { maxTokens: 800 });
    console.log('Gemini API response received for summary');
    
    res.json({ 
      choices: [{ 
        message: { 
          content: summary 
        } 
      }] 
    });
  } catch (err) {
    console.error('Gemini API error for summary:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Quiz endpoint
router.post('/quiz', auth, async (req, res) => {
  const { text } = req.body;
  
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing');
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }
  
  try {
    console.log('Making Gemini API request for quiz...');
    
    const prompt = `Create a multiple-choice quiz from this study material. Respond ONLY with a single JSON array containing 5-10 objects, each with: question, options (array), answer (string). No explanations, no Markdown, no extra text.

Study material:
${text}

Respond ONLY with a single JSON array, no explanations, no Markdown, no extra text.`;

    const quiz = await runGeminiTask("quiz", prompt, { maxTokens: 1200 });
    console.log('Gemini API response received for quiz');
    
    res.json({ 
      choices: [{ 
        message: { 
          content: quiz 
        } 
      }] 
    });
  } catch (err) {
    console.error('Gemini API error for quiz:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint
router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body;
  
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing');
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }
  
  try {
    console.log('Making Gemini API request for chat...');
    
    // Convert chat messages to a single prompt
    const conversation = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = `You are a helpful academic assistant. Continue this conversation:

${conversation}

Assistant:`;

    const response = await runGeminiTask("chat", prompt, { maxTokens: 1000 });
    console.log('Gemini API response received for chat');
    
    res.json({ 
      choices: [{ 
        message: { 
          content: response 
        } 
      }] 
    });
  } catch (err) {
    console.error('Gemini API error for chat:', err.message);
    res.status(500).json({ error: err.message });
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
      sessionLength,
      breakLength,
      preferredDays,
      optionalNotes
    } = req.body;

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
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
    
    // Additional validation for large requests
    if (weeks > 8) {
      console.warn(`Requested ${weeks} weeks, limiting to ${maxWeeks} weeks`);
    }
    
    // Implement chunking for large plans
    const chunkSize = 1; // Generate 1 week at a time for smallest responses
    const allWeeks = [];
    
    for (let startWeek = 1; startWeek <= maxWeeks; startWeek += chunkSize) {
      const endWeek = Math.min(startWeek + chunkSize - 1, maxWeeks);
      const weeksInChunk = endWeek - startWeek + 1;
      
      console.log(`Generating chunk: weeks ${startWeek}-${endWeek} (${weeksInChunk} weeks)`);
      console.log(`Chunk size: ${chunkSize}, Max weeks: ${maxWeeks}, Current startWeek: ${startWeek}`);
      
      // Create compact AI prompt for this chunk
      const timePreferenceText = {
        morning: "Morning (6 AM - 12 PM)",
        afternoon: "Afternoon (12 PM - 5 PM)", 
        evening: "Evening (5 PM - 9 PM)",
        night: "Late Night (9 PM - 1 AM)",
        flexible: "Flexible / Anytime"
      }[preference] || "Flexible";

      const notesText = optionalNotes ? `\n\nNotes: ${optionalNotes}` : "";
      
      const prompt = `Generate study plan for week ${startWeek} ONLY. Return ONLY valid JSON.

RULES:
- Maximum 2 sessions per week
- Use ONLY: ${subjects.join(", ")}
- ${sessionLength || 60}min sessions
- ${preferredDays ? preferredDays.join(', ') : 'any'} days
- ${timePreferenceText} time
- NO descriptions, NO explanations
- Keep response under 1000 characters

FORMAT:
{
  "weeks": [
    {
      "weekNumber": ${startWeek},
      "sessions": [
        {
          "subject": "EXACT_SUBJECT_NAME",
          "startTime": "2025-01-27T09:00:00.000Z",
          "endTime": "2025-01-27T10:00:00.000Z",
          "learningStyle": "balanced"
        }
      ]
    }
  ]
}

Week ${startWeek}: ${subjects.join(", ")}. ${hours}h, ${timePreferenceText}, ${sessionLength || 60}min. Start: ${new Date().toISOString().split('T')[0]}.${notesText}

MAX 2 SESSIONS. KEEP UNDER 1000 CHARS.`;

      console.log(`Sending chunk request to Gemini for weeks ${startWeek}-${endWeek}:`, {
        subjects,
        hours,
        preference,
        sessionLength,
        breakLength,
        preferredDays,
        weeksInChunk,
        hasOptionalNotes: !!optionalNotes
      });

      const message = await runGeminiTask("studyplan", prompt, { 
        maxTokens: 500,
        temperature: 0.1
      });
      
      console.log(`Chunk ${startWeek}-${endWeek} response length:`, message.length);
      
      // Check if response is too large
      if (message.length > 1000) {
        console.warn(`Chunk ${startWeek}-${endWeek} response is large:`, message.length, 'characters');
      }
      
      console.log(`Chunk ${startWeek}-${endWeek} response (first 100 chars):`, message.substring(0, 100));

      // Try to parse the JSON response for this chunk
      let chunkPlan;
      
      // Validate response size
      if (message.length > 1500) {
        console.error(`Chunk ${startWeek}-${endWeek} response too large:`, message.length, 'characters');
        return res.status(500).json({ 
          error: `Chunk ${startWeek}-${endWeek} response too large - please reduce the number of weeks or subjects`,
          responseLength: message.length,
          maxAllowed: 1500
        });
      }
      
      try {
        // First try to parse the entire message as JSON (most common case)
        chunkPlan = JSON.parse(message.trim());
      } catch (parseError) {
        console.log(`Chunk ${startWeek}-${endWeek} direct JSON parse failed, trying regex extraction...`);
        try {
          // If direct parse fails, try to extract JSON using regex
          const jsonMatch = message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            chunkPlan = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (regexParseError) {
          console.error(`Failed to parse chunk ${startWeek}-${endWeek} response:`, parseError);
          console.error('Raw response length:', message.length);
          console.error('Raw response (first 1000 chars):', message.substring(0, 1000));
          return res.status(500).json({ 
            error: `Failed to parse chunk ${startWeek}-${endWeek} response - response may be malformed`,
            rawResponse: message.substring(0, 2000) + '...',
            responseLength: message.length
          });
        }
      }

      // Add the weeks from this chunk to the overall plan
      if (chunkPlan && chunkPlan.weeks) {
        allWeeks.push(...chunkPlan.weeks);
      }
      
      // Add a small delay between chunks to avoid rate limiting
      if (startWeek + chunkSize <= maxWeeks) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Completed chunk ${startWeek}-${endWeek}. Total weeks collected: ${allWeeks.length}`);
    }
    
    console.log(`Chunking complete. Total weeks: ${allWeeks.length}, Expected: ${maxWeeks}`);
    
    // Combine all chunks into a single plan
    const plan = { weeks: allWeeks };
    
    console.log('Successfully generated study plan with chunking:', {
      totalWeeks: allWeeks.length,
      totalSessions: allWeeks.reduce((sum, week) => sum + (week.sessions?.length || 0), 0),
      subjectsUsed: [...new Set(allWeeks.flatMap(w => w.sessions?.map(s => s.subject) || []) || [])]
    });

    // Validate that all sessions use only the allowed subject names
    const allowedSubjects = new Set(subjects.map(s => s.toLowerCase()));
    let invalidSubjects = [];
    
    if (plan.weeks) {
      for (const week of plan.weeks) {
        if (week.sessions) {
          for (const session of week.sessions) {
            if (session.subject && !allowedSubjects.has(session.subject.toLowerCase())) {
              invalidSubjects.push(session.subject);
            }
          }
        }
      }
    }
    
    if (invalidSubjects.length > 0) {
      console.error('AI generated invalid subject names:', invalidSubjects);
      console.error('Allowed subjects:', subjects);
      return res.status(500).json({ 
        error: 'AI generated invalid subject names',
        invalidSubjects,
        allowedSubjects: subjects
      });
    }
    
    console.log('Successfully generated study plan:', {
      weeksCount: plan.weeks?.length || 0,
      totalSessions: plan.weeks?.reduce((sum, week) => sum + (week.sessions?.length || 0), 0) || 0,
      subjectsUsed: [...new Set(plan.weeks?.flatMap(w => w.sessions?.map(s => s.subject) || []) || [])]
    });

    res.json({ 
      success: true,
      plan,
      message: 'Study plan generated successfully'
    });

  } catch (error) {
    console.error('Study Plan Generation Failed:', error);
    
    if (error.response) {
      console.error('Gemini API Error:', error.response.data);
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

// Stats endpoint (for monitoring)
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = getModelStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Log stats to console
router.post('/stats/log', auth, async (req, res) => {
  try {
    logModelStats();
    res.json({ message: 'Stats logged to console' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log stats' });
  }
});

module.exports = router; 