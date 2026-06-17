exports.handler = async function(event) {
  try {
    const { seed, language } = JSON.parse(event.body);
    const selectedLanguage = language || 'English';
    const needsTranslation = selectedLanguage !== 'English';

    // Step 1: Generate quiz in English first (always short and reliable)
    const res1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Write 5 GMP quiz questions in English (seed:${seed}). Short sentences only. Topics: PPE, hygiene, chemicals, documentation, smoking. Return ONLY this JSON: [{"q":"question","o":["a","b","c","d"],"c":0,"e":"explanation"},{"q":"...","o":["a","b","c","d"],"c":1,"e":"..."},{"q":"...","o":["a","b","c","d"],"c":2,"e":"..."},{"q":"...","o":["a","b","c","d"],"c":3,"e":"..."},{"q":"...","o":["a","b","c","d"],"c":0,"e":"..."}]`
        }]
      })
    });

    const d1 = await res1.json();
    if(d1.error) throw new Error(d1.error.message);

    let t1 = (d1.content||[]).map(b=>b.text||'').join('');
    t1 = t1.replace(/```json/gi,'').replace(/```/g,'').trim();
    const si1 = t1.indexOf('['), ei1 = t1.lastIndexOf(']');
    if(si1===-1||ei1===-1) throw new Error('No JSON in English response');
    t1 = t1.substring(si1, ei1+1);

    const engQuiz = JSON.parse(t1);
    if(!Array.isArray(engQuiz)||engQuiz.length<5) throw new Error('Bad English quiz');

    // Step 2: If English requested, reformat and return
    if(!needsTranslation) {
      const final = engQuiz.map(q=>({
        question: q.q, options: q.o, correct: q.c, explanation: q.e
      }));
      return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
        body: JSON.stringify({ text: JSON.stringify(final) })
      };
    }

    // Step 3: Translate to target language
    const toTranslate = engQuiz.map((q,i)=>
      `Q${i+1}: ${q.q}|A: ${q.o[0]}|B: ${q.o[1]}|C: ${q.o[2]}|D: ${q.o[3]}|E: ${q.e}`
    ).join('\n');

    const res2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Translate these 5 quiz questions to ${selectedLanguage}. Keep same format. Return ONLY JSON array: [{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."},...]\n\n${toTranslate}`
        }]
      })
    });

    const d2 = await res2.json();
    if(d2.error) throw new Error(d2.error.message);

    let t2 = (d2.content||[]).map(b=>b.text||'').join('');
    t2 = t2.replace(/```json/gi,'').replace(/```/g,'').trim();
    const si2 = t2.indexOf('['), ei2 = t2.lastIndexOf(']');
    if(si2===-1||ei2===-1) throw new Error('No JSON in translation response');
    t2 = t2.substring(si2, ei2+1);

    const translated = JSON.parse(t2);
    if(!Array.isArray(translated)||translated.length<5) throw new Error('Bad translation');

    // Preserve correct answer indices from English original
    translated.forEach((q,i)=>{ q.correct = engQuiz[i].c; });

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ text: JSON.stringify(translated) })
    };

  } catch(e) {
    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
      body: JSON.stringify({ text:'', error: e.message })
    };
  }
};
