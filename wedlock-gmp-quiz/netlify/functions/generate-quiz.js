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
      max_tokens: 1500,
      system: `You are a GMP quiz generator for Wedlock Paper Converters Ltd. Generate exactly 5 multiple-choice questions from the GMP training content (seed:${seed}). Vary topics each time. IMPORTANT: Generate ALL questions, answer options, and explanations written entirely in ${selectedLanguage}. If the language is not English, translate everything fully and naturally into ${selectedLanguage} — do not mix languages. Return ONLY a valid JSON array, no markdown. Each item: "question"(string),"options"(4 strings),"correct"(0-3),"explanation"(1-2 sentences). All text must be in ${selectedLanguage}.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await res.json();
  const text = (data.content || []).map(b => b.text || '').join('');

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ text })
  };
};
