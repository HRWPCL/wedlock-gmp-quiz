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
          content: `Create 5 short GMP quiz questions for a packaging factory in ${selectedLanguage} (seed:${seed}). Topics to cover: hand washing rules, PPE requirements, hair nets and beard nets, chemical storage, documentation rules, smoking policy, phone rules, food on production floor, safety shoes, ink room access. Return ONLY a JSON array. Each item: {"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}. Keep all text short. All text in ${selectedLanguage}. Start with [`
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

