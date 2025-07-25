export async function groqChatCompletion(messages) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key not found in environment variables');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // updated model
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    let errorMsg = `Groq API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data;
} 