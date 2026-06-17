exports.handler = async function(event) {
  try {
    const { seed, language } = JSON.parse(event.body);
    const selectedLanguage = language || 'English';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Write 5 GMP factory quiz questions in ${selectedLanguage} (seed:${seed}). Rules: max 10 words per question, max 5 words per answer option, max 10 words per explanation. Return ONLY JSON array, no other text. Format: [{"question":"?","options":["a","b","c","d"],"correct":0,"explanation":"..."},{"question":"?","options":["a","b","c","d"],"correct":1,"explanation":"..."},{"question":"?","options":["a","b","c","d"],"correct":2,"explanation":"..."},{"question":"?","options":["a","b","c","d"],"correct":3,"explanation":"..."},{"question":"?","options":["a","b","c","d"],"correct":0,"explanation":"..."}]`
        }]
      })
    });

    const data = await res.json();
    if(data.error) throw new Error(data.error.message);

    let text = (data.content||[]).map(b=>b.text||'').join('');
    text = '[' + text;
    text = text.replace(/```json/gi,'').replace(/```/g,'').trim();

    const si = text.indexOf('[');
    const ei = text.lastIndexOf(']');
    if(si === -1 || ei === -1) throw new Error('No JSON array found in response');
    text = text.substring(si, ei+1);

    const result = JSON.parse(text);
    if(!Array.isArray(result) || result.length < 5) throw new Error('Not enough questions generated');

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ text })
    };

  } catch(e) {
    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ text:'', error: e.message })
    };
  }
};


