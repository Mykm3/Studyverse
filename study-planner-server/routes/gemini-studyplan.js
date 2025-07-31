const express = require('express');
const { runGeminiTask } = require('../utils/gemini');
const auth = require('../middleware/auth');
const router = express.Router();
const axios = require('axios');

// Debug logging for Gemini configuration
console.log('Gemini Study Plan configuration:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }

    if (!hours || hours < 1 || hours > 40) {
      return res.status(400).json({ error: 'Weekly hours must be between 1 and 40' });
    }

    if (!weeks || weeks < 1 || weeks > 52) {
      return res.status(400).json({ error: 'Weeks must be between 1 and 52' });
    }

    const maxWeeks = Math.min(weeks, 8);

    const timePreferenceText = {
      morning: "Morning (6 AM - 12 PM)",
      afternoon: "Afternoon (12 PM - 5 PM)", 
      evening: "Evening (5 PM - 9 PM)",
      night: "Late Night (9 PM - 1 AM)",
      flexible: "Flexible / Anytime"
    }[preference] || "Flexible";

    const notesText = optionalNotes ? `\n\nNotes: ${optionalNotes}` : "";

    const prompt = `Create a study schedule for ${maxWeeks} weeks. Return only valid JSON.

CRITICAL RULES:
- Use ONLY these EXACT subject names: ${subjects.join(", ")}
- DO NOT create sub-topics, variations, or suffixes
- ${hours} hours per week
- ${sessionLength || 60} minute sessions
- ${timePreferenceText} time
- Maximum 2 sessions per week per subject
- DO NOT wrap in markdown or include explanations
- Return only raw valid JSON

Format:
{
  "weeks": [
    {
      "weekNumber": 1,
      "sessions": [
        {
          "subject": "EXACT_SUBJECT_NAME_ONLY",
          "startTime": "2025-01-27T09:00:00.000Z",
          "endTime": "2025-01-27T10:00:00.000Z",
          "learningStyle": "balanced"
        }
      ]
    }
  ]
}

${notesText}
`;

    console.log(`Prompt (first 200 chars):`, prompt.slice(0, 200));

    let message;
    let usedFallback = false;

    try {
      message = await runGeminiTask("studyplan", prompt, { 
        maxTokens: 4000,
        temperature: 0.1 
      });
    } catch (geminiError) {
      usedFallback = true;
      try {
        const groqResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content: `Generate a ${maxWeeks}-week study plan using ONLY exact subject names: ${subjects.join(", ")}. Return valid JSON. No markdown, no explanations.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        }, {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        message = groqResponse.data.choices[0].message.content;
      } catch (groqError) {
        return res.status(500).json({ 
          error: 'AI services unavailable',
          details: {
            geminiError: geminiError.message,
            groqError: groqError.message
          }
        });
      }
    }

    if (!message || message.trim().length === 0) {
      return res.status(500).json({ error: "Empty response from AI" });
    }

    if (message.length > 15000) {
      return res.status(500).json({ 
        error: "Response too large - reduce number of weeks or subjects", 
        responseLength: message.length 
      });
    }

    let cleanedMessage = message.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();

    // 🔒 Safety: block parsing of clearly incomplete JSON
    if (!cleanedMessage.trim().endsWith("}")) {
      return res.status(500).json({
        error: "AI response was cut off and is missing the end of the JSON.",
        cleanedResponse: cleanedMessage.slice(-500),
        totalLength: cleanedMessage.length,
        usedFallback,
      });
    }

    // 🚨 Optional deep structure check
    const isLikelyComplete = cleanedMessage.includes('"weeks"') &&
                             cleanedMessage.trim().endsWith("}") &&
                             (cleanedMessage.match(/\}/g) || []).length >= 2;

    if (!isLikelyComplete) {
      return res.status(500).json({
        error: "Incomplete or malformed JSON structure from AI.",
        preview: cleanedMessage.slice(-500),
        totalLength: cleanedMessage.length,
        usedFallback
      });
    }

    let plan;
    try {
      plan = JSON.parse(cleanedMessage);
    } catch (parseError) {
      return res.status(500).json({ 
        error: "Failed to parse AI response",
        parseError: parseError.message,
        preview: cleanedMessage.slice(-500),
        fullMessage: message.slice(0, 500)
      });
    }

    const allowedSubjects = new Set(subjects.map(s => s.toLowerCase()));
    let invalidSubjects = [];

    for (const week of plan.weeks || []) {
      for (const session of week.sessions || []) {
        if (session.subject && !allowedSubjects.has(session.subject.toLowerCase())) {
          invalidSubjects.push(session.subject);
        }
      }
    }

    if (invalidSubjects.length > 0) {
      return res.status(500).json({
        error: "AI returned unrecognized subject names",
        invalidSubjects,
        allowedSubjects: subjects
      });
    }

    return res.json({
      success: true,
      plan,
      message: 'Study plan generated successfully',
      services: {
        primary: 'Gemini 2.5 Pro',
        fallback: usedFallback ? 'Groq Llama3-70B' : null
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router; 