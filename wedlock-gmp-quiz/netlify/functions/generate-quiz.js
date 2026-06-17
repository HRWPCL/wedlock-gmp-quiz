exports.handler = async function(event) {
  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '', error: 'Bad request body' })
    };
  }

  const { prompt, seed, language } = parsed;
  const selectedLanguage = language || 'English';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are a GMP quiz generator for Wedlock Paper Converters Ltd. Generate exactly 5 multiple-choice questions from the GMP training content (seed:${seed}). CRITICAL INSTRUCTIONS: 1) Return ONLY a raw JSON array starting with [ and ending with ] — absolutely no other text before or after. 2) Write ALL text in ${selectedLanguage}. 3) Keep all text short and concise. 4) Each item must have: "question"(string), "options"(array of exactly 4 strings), "correct"(integer 0-3), "explanation"(string). 5) Do not include any introduction, explanation, or markdown. Start your response with [ and end with ]`,
      messages: [{ role: 'user', content: `Generate 5 GMP quiz questions in ${selectedLanguage}. Return ONLY the JSON array, nothing else. Start immediately with [` }]
    })
  });

  const data = await res.json();
  let text = (data.content || []).map(b => b.text || '').join('');

  // Aggressive cleanup
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Extract JSON array
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1) {
    text = text.substring(startIdx, endIdx + 1);
  }

  // Validate
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length < 5) {
      throw new Error('Not enough questions');
    }
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '', error: e.message, raw: text.substring(0, 200) })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  };
};
