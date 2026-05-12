exports.handler = async function(event) {
  const { prompt, seed, language } = JSON.parse(event.body);
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
      system: `You are a GMP quiz generator for Wedlock Paper Converters Ltd. Generate exactly 5 multiple-choice questions from the GMP training content (seed:${seed}). Vary topics each time. IMPORTANT: Write ALL text entirely in ${selectedLanguage}. Keep questions and answers concise and short — maximum 15 words per question, maximum 8 words per answer option, maximum 20 words per explanation. Return ONLY a valid JSON array, no markdown, no extra text. Each item: "question"(string),"options"(array of 4 short strings),"correct"(number 0-3),"explanation"(short string). Ensure valid JSON with all strings properly closed.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await res.json();
  let text = (data.content || []).map(b => b.text || '').join('');

  // Clean up response
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // Extract just the JSON array
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1) {
    text = text.substring(startIdx, endIdx + 1);
  }

  // Validate JSON before returning
  try {
    JSON.parse(text);
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON from AI', raw: text })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  };
};
