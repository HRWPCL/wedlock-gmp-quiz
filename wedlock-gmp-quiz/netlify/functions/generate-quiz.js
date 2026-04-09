exports.handler = async function(event) {
  const { prompt, seed } = JSON.parse(event.body);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a GMP quiz generator for Wedlock Paper Converters Ltd. Generate exactly 5 multiple-choice questions from the GMP training content (seed:${seed}). Vary topics each time. Return ONLY a valid JSON array, no markdown. Each item: "question"(string),"options"(4 strings),"correct"(0-3),"explanation"(1-2 sentences).`,
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