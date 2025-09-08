const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

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

// Study plan scheduling endpoint
router.post('/studyplan', auth, async (req, res) => {
  try {
    const { 
      subjects, 
      subjectSessions, // New: sessions per subject
      preference, 
      weeks, 
      sessionLength,
      breakLength,
      preferredDays,
      optionalNotes
    } = req.body;

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is missing');
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }

    if (subjects.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 subjects allowed for optimal performance' });
    }

    if (!weeks || weeks < 1 || weeks > 4) {
      return res.status(400).json({ error: 'Weeks must be between 1 and 4' });
    }

    const maxWeeks = Math.min(weeks, 4); // Maximum 4 weeks

    // Dynamic session capacity validation based on user choices
    const calculateMaxSessionsPerDay = (preference, sessionLength, breakLength) => {
      let maxSessions = 3; // Default maximum

      // Evening time constraint (6 PM - 10 PM = 4 hours)
      if (preference === "evening") {
        // Check if we can fit 3 sessions with current settings
        const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2); // 3 sessions + 2 breaks
        const availableTime = 4 * 60; // 4 hours in minutes
        
        if (totalTimeNeeded <= availableTime) {
          maxSessions = 3; // Can fit 3 sessions
        } else {
          maxSessions = 2; // Can only fit 2 sessions
        }
      }

      // 90-minute sessions with longer breaks constraint
      if (sessionLength === 90 && breakLength > 5) {
        maxSessions = Math.min(maxSessions, 2);
      }

      return maxSessions;
    };

    const maxSessionsPerDay = calculateMaxSessionsPerDay(preference, sessionLength, breakLength);
    const totalSessionsPerWeek = Object.values(subjectSessions || {}).reduce((sum, sessions) => sum + sessions, 0);
    const totalSessionsOverWeeks = totalSessionsPerWeek * maxWeeks;
    const totalAvailableSlots = (preferredDays || []).length * maxSessionsPerDay * maxWeeks;
    const recommendedMaxPerSubject = Math.min(Math.floor(totalAvailableSlots / subjects.length / maxWeeks), 4);
    
    // Generate constraint message for better error reporting
    let constraintMessage = "";
    if (preference === "evening") {
      const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
      const availableTime = 4 * 60;
      if (totalTimeNeeded > availableTime) {
        constraintMessage = `Evening time (6 PM – 10 PM) allows only ${maxSessionsPerDay} study sessions per day with current settings. `;
      } else {
        constraintMessage = "Evening time (6 PM – 10 PM) allows 3 study sessions per day. ";
      }
    } else if (sessionLength === 90 && breakLength > 5) {
      constraintMessage = "90-minute sessions with longer breaks reduce your daily capacity to 2 sessions. ";
    }
    
    if (totalSessionsOverWeeks > totalAvailableSlots) {
      return res.status(400).json({ 
        error: `Session capacity exceeded. You've selected ${totalSessionsOverWeeks} total sessions over ${maxWeeks} weeks, but only have ${totalAvailableSlots} time slots available. ${constraintMessage}Reduce sessions per subject (max ${recommendedMaxPerSubject} per week) or add more study days.` 
      });
    }

    const timePreferenceText = {
      morning: "Morning (6 AM - 12 PM)",
      afternoon: "Afternoon (12 PM - 5 PM)", 
      evening: "Evening (5 PM - 9 PM)",
      night: "Late Night (9 PM - 1 AM)",
      flexible: "Flexible / Anytime"
    }[preference] || "Flexible";

    const notesText = optionalNotes ? `\n\nNotes: ${optionalNotes}` : "";

    // Get current date and calculate start date (next Monday or today if it's Monday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days until next Monday
    // If today is Monday (1), add 0 days
    // If today is Tuesday (2), add 6 days to get to next Monday
    // If today is Wednesday (3), add 5 days to get to next Monday
    // etc.
    const daysUntilMonday = currentDay === 1 ? 0 : (8 - currentDay);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysUntilMonday);
    startDate.setHours(9, 0, 0, 0); // Start at 9 AM
    
    console.log(`Current day: ${currentDay} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]})`);
    console.log(`Days until Monday: ${daysUntilMonday}`);
    console.log(`Start date: ${startDate.toISOString().split('T')[0]} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startDate.getDay()]})`);

    // Calculate time slots based on preference
    const getTimeSlots = (preference) => {
      switch (preference) {
        case 'morning': return ['09:00', '10:30', '12:00'];
        case 'afternoon': return ['13:00', '14:30', '16:00'];
        case 'evening': return ['17:00', '18:30', '20:00'];
        case 'night': return ['21:00', '22:30'];
        default: return ['09:00', '14:00', '19:00']; // flexible
      }
    };

    const timeSlots = getTimeSlots(preference);
    const sessionDuration = sessionLength || 60;
    const breakDuration = breakLength || 15;
    // Normalize and validate preferred days
    const normalizedPreferredDays = preferredDays && preferredDays.length > 0 
      ? preferredDays.map(day => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase())
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    const studyDays = normalizedPreferredDays.join(", ");
    
    console.log(`User preferred days: ${preferredDays}`);
    console.log(`Normalized preferred days: ${normalizedPreferredDays.join(", ")}`);

    // totalSessionsPerWeek is already calculated above for validation

    const prompt = `Generate a personalized study plan for EXACTLY ${maxWeeks} week(s) starting from ${startDate.toISOString().split('T')[0]}.

USER REQUIREMENTS:
- Number of weeks: EXACTLY ${maxWeeks} weeks (no more, no less)
- Preferred time of day: ${timePreferenceText}
- Session duration: ${sessionDuration} minutes
- Break duration: ${breakDuration} minutes
- Available time slots: ${timeSlots.join(", ")} (${preference} time)

MANDATORY DAY RESTRICTIONS:
- You MUST schedule sessions ONLY on these specific days: ${studyDays}
- DO NOT schedule on any other days
- Week starts on Monday (Monday = day 1, Tuesday = day 2, etc.)
- DISTRIBUTE SESSIONS EVENLY: When multiple days are available, spread sessions across all available days instead of clustering them
- MAXIMUM SESSIONS PER DAY: ${maxSessionsPerDay} sessions per day maximum
- SESSION CAPACITY RULES: 
  * Default: 3 sessions per day (Morning/Afternoon/Flexible with 60min sessions)
  * Evening time (6 PM - 10 PM): ${preference === "evening" ? (() => {
    const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
    const availableTime = 4 * 60;
    return totalTimeNeeded <= availableTime ? "3 sessions per day (fits with current settings)" : "2 sessions per day (reduced due to session/break duration)";
  })() : "2-3 sessions per day (depends on session/break duration)"}
  * 90-minute sessions with breaks > 5 minutes: 2 sessions per day
  * Current setting: ${maxSessionsPerDay} sessions per day due to ${preference === "evening" ? (() => {
    const totalTimeNeeded = (sessionLength * 3) + (breakLength * 2);
    const availableTime = 4 * 60;
    return totalTimeNeeded <= availableTime ? "evening time with optimal settings" : "evening time with reduced capacity";
  })() : sessionLength === 90 && breakLength > 5 ? "90-minute sessions with longer breaks" : "standard time window"}

SUBJECTS TO INCLUDE (use EXACT names only):
${subjects.map(subject => `- ${subject}: ${subjectSessions?.[subject] || 1} session(s) per week`).join("\n")}

TOTAL SESSIONS: ${totalSessionsPerWeek} sessions per week (${(totalSessionsPerWeek * sessionDuration) / 60} hours)
TOTAL OVER ${maxWeeks} WEEKS: ${totalSessionsOverWeeks} sessions (${(totalSessionsOverWeeks * sessionDuration) / 60} hours)
AVAILABLE DAYS: ${normalizedPreferredDays.length} days (${studyDays})
TOTAL AVAILABLE SLOTS: ${totalAvailableSlots} sessions over ${maxWeeks} weeks
RECOMMENDED MAX PER SUBJECT: ${recommendedMaxPerSubject} sessions per week

DISTRIBUTION STRATEGY:
- With ${totalSessionsPerWeek} sessions across ${normalizedPreferredDays.length} available days
- Target: ${Math.ceil(totalSessionsPerWeek / normalizedPreferredDays.length)} sessions per day maximum
- MINIMUM: ${Math.floor(totalSessionsPerWeek / normalizedPreferredDays.length)} sessions per day minimum
- MAXIMUM PER DAY: ${maxSessionsPerDay} sessions per day (constrained by time window and session duration)
- CAPACITY EXPLANATION: ${maxSessionsPerDay} sessions/day limit due to ${preference === "evening" ? "evening time constraint (4-hour window)" : sessionLength === 90 && breakLength > 5 ? "90-minute sessions with longer breaks" : "standard 6-hour time window"}
- DISTRIBUTION RULE: Use ALL ${normalizedPreferredDays.length} selected days evenly
- ANTI-CLUSTERING: If you have ${totalSessionsPerWeek} sessions and ${normalizedPreferredDays.length} days, distribute them evenly. Don't put 3 sessions on Monday and skip Tuesday.
- EXAMPLE: ${totalSessionsPerWeek} sessions ÷ ${normalizedPreferredDays.length} days = ${(totalSessionsPerWeek / normalizedPreferredDays.length).toFixed(1)} sessions per day average
- CRITICAL: You MUST use at least ${Math.ceil(normalizedPreferredDays.length * 0.5)} out of ${normalizedPreferredDays.length} selected days for ${totalSessionsPerWeek} sessions
- LOW SESSION RULE: If you have ${totalSessionsPerWeek} sessions and ${normalizedPreferredDays.length} days, spread them across at least ${Math.ceil(totalSessionsPerWeek / 2)} different days
- WEEKDAY PRIORITIZATION: When all 7 days are selected but sessions are limited (≤8 sessions/week), prioritize weekdays (Monday-Friday) over weekends for better study focus

ADDITIONAL NOTES:
${optionalNotes || "None"}

CRITICAL RULES:
1. Use ONLY the exact subject names listed above - no variations or sub-topics
2. Generate EXACTLY ${maxWeeks} weeks - no more, no less
3. Start the schedule from ${startDate.toISOString().split('T')[0]}. Each week begins on a Monday.
4. DO NOT create sessions in the past
5. Maximum 2 sessions per week per subject
6. MANDATORY: Schedule sessions ONLY on these exact days: ${studyDays}
7. DISTRIBUTE EVENLY: Spread ${totalSessionsPerWeek} sessions across all ${normalizedPreferredDays.length} available days
8. MAXIMUM PER DAY: Limit to ${maxSessionsPerDay} sessions per day maximum (constrained by time window and session duration)
9. Use the specified time slots: ${timeSlots.join(", ")}
10. Each session should be ${sessionDuration} minutes long
11. WEEKLY DISTRIBUTION: Each week must have exactly ${totalSessionsPerWeek} sessions distributed across ${normalizedPreferredDays.length} days
12. NO DAY SKIPPING: If user selected 6 days, use ALL 6 days. If user selected 7 days, use ALL 7 days
13. EVEN DISTRIBUTION: If you have ${totalSessionsPerWeek} sessions and ${normalizedPreferredDays.length} days, aim for ${Math.floor(totalSessionsPerWeek / normalizedPreferredDays.length)} sessions per day minimum
14. AVOID CLUSTERING: Don't put multiple sessions on one day and skip the next day
15. Return only valid JSON - no markdown, no explanations

DAY MAPPING (for reference):
- Monday = ${startDate.toISOString().split('T')[0]} (week start)
- Tuesday = ${new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Wednesday = ${new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Thursday = ${new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Friday = ${new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Saturday = ${new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Sunday = ${new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

WEEKLY SCHEDULING RULES:
- Each week starts on Monday and ends on Sunday
- DO NOT overlap sessions between weeks
- If user selected 6 days (e.g., Mon-Sat), use ALL 6 days evenly
- If user selected 7 days (Mon-Sun), use ALL 7 days evenly
- NEVER skip a selected day unless you've reached the maximum sessions per day
- DISTRIBUTE SESSIONS EVENLY: If you have 12 sessions and 6 days, put 2 sessions per day
- AVOID CLUSTERING: Don't put 3-4 sessions on Monday and skip Tuesday
- WEEKDAY PRIORITIZATION: When all 7 days are selected but sessions are limited (≤8 sessions/week), prioritize weekdays (Monday-Friday) over weekends

WARNING: If user selected Monday, Wednesday, Friday, you MUST schedule on Monday, Wednesday, Friday ONLY. Do NOT schedule on Tuesday, Thursday, Saturday.

EXPECTED JSON FORMAT:
{
  "weeks": [
    {
      "weekNumber": 1,
      "sessions": [
        {
          "subject": "EXACT_SUBJECT_NAME_ONLY",
          "startTime": "${startDate.toISOString()}",
          "endTime": "${new Date(startDate.getTime() + sessionDuration * 60000).toISOString()}",
          "learningStyle": "balanced"
        }
      ]
    }
  ]
}

EXAMPLE: If start date is ${startDate.toISOString().split('T')[0]} (Monday) and user selected Monday, Wednesday, Friday:
- Monday sessions: ${startDate.toISOString().split('T')[0]}T09:00:00.000Z
- Wednesday sessions: ${new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T09:00:00.000Z  
- Friday sessions: ${new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T09:00:00.000Z

DISTRIBUTION EXAMPLES:
- If user has 12 sessions per week and selected all 7 days (Mon-Sun):
  * GOOD: 1-2 sessions per day, spread across all 7 days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  * BAD: 3-4 sessions clustered on just Monday, Wednesday, Thursday, Friday, skipping Tuesday, Saturday, Sunday

- If user has 12 sessions per week and selected 6 days (Mon-Sat):
  * GOOD: 2 sessions per day, spread across all 6 days (Mon, Tue, Wed, Thu, Fri, Sat)
  * BAD: 3 sessions on Monday, 3 on Wednesday, 3 on Friday, skip Tuesday, Thursday, Saturday

- If user has 9 sessions per week and selected 6 days (Mon-Sat):
  * GOOD: 1-2 sessions per day, spread across all 6 days
  * BAD: 3 sessions on Monday, 3 on Wednesday, 3 on Friday, skip Tuesday, Thursday, Saturday

- If user has 15 sessions per week and selected all 7 days (Mon-Sun):
  * GOOD: 2-3 sessions per day, spread across all 7 days
  * BAD: 4-5 sessions on Monday, Wednesday, Friday, skip Tuesday, Thursday, Saturday, Sunday

- If user has 4 sessions per week and selected all 7 days (Mon-Sun):
  * GOOD: 1 session on Monday, 1 on Tuesday, 1 on Wednesday, 1 on Thursday (prioritize weekdays for few sessions)
  * BAD: 2 sessions on Monday, 2 on Wednesday, skip Tuesday, Thursday, Saturday, Sunday

- If user has 6 sessions per week and selected all 7 days (Mon-Sun):
  * GOOD: 1 session on Monday, 1 on Tuesday, 1 on Wednesday, 1 on Thursday, 1 on Friday, 1 on Saturday (spread across 6 days)
  * BAD: 3 sessions on Monday, 3 on Wednesday, skip Tuesday, Thursday, Friday, Saturday, Sunday

- If user has 8 sessions per week and selected all 7 days (Mon-Sun):
  * GOOD: 1-2 sessions on Monday, Tuesday, Wednesday, Thursday, Friday (prioritize weekdays for moderate sessions)
  * BAD: 4 sessions on Monday, 4 on Wednesday, skip Tuesday, Thursday, Friday, Saturday, Sunday

WEEKDAY PRIORITIZATION RULE: When all 7 days are selected but sessions are limited (≤8 sessions/week), prioritize weekdays (Monday-Friday) over weekends. This allows for more focused study during the work week.

REMEMBER: Use ALL selected days evenly. Don't skip days unless you've reached the maximum sessions per day limit.
DISTRIBUTION RULE: With ${totalSessionsPerWeek} sessions and ${normalizedPreferredDays.length} days, aim to use at least ${Math.ceil(totalSessionsPerWeek / 2)} different days.
MINIMUM DAYS: You must use at least ${Math.ceil(normalizedPreferredDays.length * 0.5)} out of ${normalizedPreferredDays.length} selected days for ${totalSessionsPerWeek} sessions.
WEEKDAY PRIORITIZATION: When all 7 days are selected but sessions are limited (≤8 sessions/week), prioritize weekdays (Monday-Friday) over weekends for better study focus.

✅ Return only the schedule in plain, structured JSON format. Do not add explanations, markdown, or comments.`;

    console.log(`Groq study plan prompt (first 200 chars):`, prompt.slice(0, 200));

    const messages = [
      {
        role: "system",
        content: `You are a study planning assistant. Generate personalized study schedules based on user requirements. Always use exact subject names provided, start from the current date, and return only valid JSON format. Never create sessions in the past.`
      },
      {
        role: "user",
        content: prompt
      }
    ];

    console.log('Making Groq API request for study plan...');
    const groqRes = await axios.post(
      GROQ_API_URL,
      { 
        model: MODEL, 
        messages,
        temperature: 0.1,
        max_tokens: 4000
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    
    console.log('Groq API response received for study plan');
    
    const message = groqRes.data.choices[0].message.content;

    if (!message || message.trim().length === 0) {
      return res.status(500).json({ 
        error: "Empty response from AI",
        message: "Looks like we couldn't generate a valid plan this time. Try reducing the number of subjects or increasing your weekly hours."
      });
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
        totalLength: cleanedMessage.length
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
        totalLength: cleanedMessage.length
      });
    }

    let plan;
    try {
      plan = JSON.parse(cleanedMessage);
    } catch (parseError) {
      return res.status(500).json({ 
        error: "Failed to parse AI response",
        message: "Looks like we couldn't generate a valid plan this time. Try reducing the number of subjects or increasing your weekly hours.",
        parseError: parseError.message,
        preview: cleanedMessage.slice(-500),
        fullMessage: message.slice(0, 500)
      });
    }

    const allowedSubjects = new Set(subjects.map(s => s.toLowerCase()));
    let invalidSubjects = [];
    let pastSessions = [];
    let wrongDaySessions = [];
    let wrongWeekCount = false;
    let clusteredSessions = false;
    let skippedDays = false;
    const validationDate = new Date();
    validationDate.setHours(0, 0, 0, 0); // Start of today

    // Create a set of allowed days for quick lookup
    const allowedDays = new Set(normalizedPreferredDays);
    
    // Check if the correct number of weeks was generated
    if (!plan.weeks || plan.weeks.length !== maxWeeks) {
      wrongWeekCount = true;
      console.log(`AI generated ${plan.weeks?.length || 0} weeks instead of ${maxWeeks} weeks`);
    }

    // Check for session clustering in each week
    for (const week of plan.weeks || []) {
      const sessionsByDay = {};
      
      for (const session of week.sessions || []) {
        if (session.subject && !allowedSubjects.has(session.subject.toLowerCase())) {
          invalidSubjects.push(session.subject);
        }
        
        // Check if session is in the past
        if (session.startTime) {
          const sessionDate = new Date(session.startTime);
          if (sessionDate < validationDate) {
            pastSessions.push({
              subject: session.subject,
              date: sessionDate.toISOString().split('T')[0]
            });
          }
          
          // Check if session is on the wrong day
          const sessionDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];
          if (!allowedDays.has(sessionDayName)) {
            wrongDaySessions.push({
              subject: session.subject,
              date: sessionDate.toISOString().split('T')[0],
              day: sessionDayName,
              expectedDays: Array.from(allowedDays)
            });
          }
          
          // Track sessions per day for clustering detection
          const dayKey = sessionDate.toISOString().split('T')[0];
          sessionsByDay[dayKey] = (sessionsByDay[dayKey] || 0) + 1;
        }
      }
      
      // Check for clustering: if many days available but sessions are clustered
      const daysWithSessions = Object.keys(sessionsByDay).length;
      const maxSessionsPerDay = Math.max(...Object.values(sessionsByDay));
      const totalSessionsInWeek = Object.values(sessionsByDay).reduce((sum, count) => sum + count, 0);
      
      // Only flag clustering if there's significant underutilization AND high concentration
      if (normalizedPreferredDays.length >= 5 && 
          daysWithSessions < normalizedPreferredDays.length * 0.6 && // More lenient threshold
          maxSessionsPerDay > 3) { // Only flag if there are 4+ sessions on one day
        clusteredSessions = true;
        console.log(`Sessions are clustered: ${totalSessionsInWeek} sessions across only ${daysWithSessions} days instead of using all ${normalizedPreferredDays.length} available days`);
      }
      
      // Check for day skipping: if user selected many days but AI only used significantly fewer days
      if (normalizedPreferredDays.length >= 6) {
        // More lenient threshold for fewer sessions
        const totalSessionsInWeek = Object.values(sessionsByDay).reduce((sum, count) => sum + count, 0);
        let minDaysRequired;
        
        // Check if all 7 days are selected (including weekends)
        const hasAllDays = normalizedPreferredDays.length === 7;
        const hasWeekends = normalizedPreferredDays.includes('Saturday') || normalizedPreferredDays.includes('Sunday');
        
        if (totalSessionsInWeek <= 4) {
          // For 4 or fewer sessions, prioritize weekdays if all days are selected
          if (hasAllDays && hasWeekends) {
            minDaysRequired = 4; // Allow focusing on weekdays (Mon-Fri) for very few sessions
          } else {
            minDaysRequired = Math.ceil(normalizedPreferredDays.length * 0.5); // Only require 50% of days
          }
        } else if (totalSessionsInWeek <= 8) {
          // For 5-8 sessions, be more flexible with weekday prioritization
          if (hasAllDays && hasWeekends) {
            minDaysRequired = 5; // Allow focusing on weekdays (Mon-Fri) for moderate sessions
          } else {
            minDaysRequired = Math.ceil(normalizedPreferredDays.length * 0.6);
          }
        } else {
          // For 9+ sessions, require more distribution
          minDaysRequired = Math.ceil(normalizedPreferredDays.length * 0.7);
        }
        
        if (daysWithSessions < minDaysRequired) {
          skippedDays = true;
          console.log(`AI skipped days: used only ${daysWithSessions} days out of ${normalizedPreferredDays.length} selected days (minimum required: ${minDaysRequired} for ${totalSessionsInWeek} sessions)`);
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

    if (wrongWeekCount) {
      return res.status(500).json({
        error: "AI generated wrong number of weeks",
        message: `Expected exactly ${maxWeeks} weeks, but got ${plan.weeks?.length || 0} weeks. Please try again.`
      });
    }

    if (clusteredSessions) {
      return res.status(500).json({
        error: "AI clustered sessions instead of distributing evenly",
        message: `Sessions are clustered on too few days. With ${normalizedPreferredDays.length} available days, sessions should be spread more evenly. Please try again.`
      });
    }

    if (skippedDays) {
      return res.status(500).json({
        error: "AI skipped selected days",
        message: `AI didn't distribute sessions evenly across all ${normalizedPreferredDays.length} selected days. With ${totalSessionsPerWeek} sessions per week, please try to spread them across more days. Please try again.`
      });
    }

    if (pastSessions.length > 0) {
      return res.status(500).json({
        error: "AI created sessions in the past",
        pastSessions,
        message: "Please regenerate the plan to start from the current date"
      });
    }

    if (wrongDaySessions.length > 0) {
      console.log(`AI scheduled sessions on wrong days. Attempting to correct...`);
      
      // Try to fix the day mapping by shifting sessions to correct days
      const dayMapping = {
        'Tuesday': 'Monday',
        'Wednesday': 'Tuesday', 
        'Thursday': 'Wednesday',
        'Friday': 'Thursday',
        'Saturday': 'Friday',
        'Sunday': 'Saturday',
        'Monday': 'Sunday'
      };
      
      let correctedSessions = 0;
      for (const week of plan.weeks || []) {
        for (const session of week.sessions || []) {
          if (session.startTime) {
            const sessionDate = new Date(session.startTime);
            const sessionDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];
            
            // If this session is on a wrong day, try to correct it
            if (!allowedDays.has(sessionDayName) && dayMapping[sessionDayName]) {
              const correctDayName = dayMapping[sessionDayName];
              if (allowedDays.has(correctDayName)) {
                // Calculate the correct date by adjusting the day
                const daysToAdjust = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(correctDayName) - 
                                   ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(sessionDayName);
                
                const correctedDate = new Date(sessionDate);
                correctedDate.setDate(sessionDate.getDate() + daysToAdjust);
                
                session.startTime = correctedDate.toISOString();
                session.endTime = new Date(correctedDate.getTime() + sessionDuration * 60000).toISOString();
                correctedSessions++;
                
                console.log(`Corrected session from ${sessionDayName} to ${correctDayName}: ${session.subject}`);
              }
            }
          }
        }
      }
      
      if (correctedSessions > 0) {
        console.log(`Successfully corrected ${correctedSessions} sessions to correct days`);
        // Continue with the corrected plan instead of returning an error
      } else {
        return res.status(500).json({
          error: "AI scheduled sessions on wrong days",
          wrongDaySessions,
          message: `Sessions were scheduled on incorrect days. Expected: ${Array.from(allowedDays).join(", ")}, but got sessions on: ${[...new Set(wrongDaySessions.map(s => s.day))].join(", ")}`
        });
      }
    }

    return res.json({
      success: true,
      plan,
      message: 'Study plan generated successfully',
      services: {
        primary: 'Groq Llama-3.3-70B Versatile'
      }
    });

  } catch (error) {
    console.error('Groq study plan error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.response?.data?.error || error.message
    });
  }
});

module.exports = router; 