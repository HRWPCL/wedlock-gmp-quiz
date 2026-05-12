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
      max_tokens: 2000,
      system: `You are a GMP quiz generator for Wedlock Paper Converters Ltd. Generate exactly 5 multiple-choice questions from the GMP training content (seed:${seed}). Vary topics each time. IMPORTANT: Generate ALL questions, answer options, and explanations written entirely in ${selectedLanguage}. If the language is not English, translate everything fully and naturally into ${selectedLanguage} — do not mix languages. Return ONLY a valid JSON array, no markdown, no extra text before or after. Each item must have exactly these keys: "question"(string),"options"(array of exactly 4 strings),"correct"(number 0-3),"explanation"(string). Ensure all strings are properly escaped. All text must be in ${selectedLanguage}.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await res.json();
  let text = (data.content || []).map(b => b.text || '').join('');

  // Clean up common JSON issues
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // Find the JSON array in the response
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1) {
    text = text.substring(startIdx, endIdx + 1);
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  };
};
