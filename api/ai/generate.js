module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { topic, format, tone, target_time } = req.body || {};
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    const authHeader = req.headers.authorization || '';
    const bearerKey = authHeader.replace(/^Bearer\s+/i, '').trim();

    const apiKey = process.env.OPENROUTER_API_KEY || 
                   process.env.PUBLIC_OPEN_ROUTER_API_KEY || 
                   bearerKey;

    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'No OpenRouter API key found. Please add OPENROUTER_API_KEY in your Vercel project environment variables, or enter your key in the AI modal settings.' 
      });
    }

    const systemInstruction = 
      "You are an elite speechwriter for world-class speakers and content creators. " +
      "Write spoken teleprompter scripts optimized for live reading. " +
      "Use short, punchy sentences, natural breath marks, and bracketed stage cues like [PAUSE 1s], [SMILE], [EMPHASIZE]. " +
      "Do NOT include markdown titles or extra chit-chat. Return ONLY the spoken teleprompter script.";

    const targetWords = parseInt((target_time || "60").split(' ')[0], 10) * 130 / 60 || 150;
    const prompt = 
      `Write a ${format || 'speech'} about '${topic}'.\n` +
      `Tone: ${tone || 'conversational'}.\n` +
      `Target duration: ${target_time || '60 seconds'} (approx ${Math.round(targetWords)} words).\n` +
      `Format it with clear paragraph breaks for effortless teleprompter scrolling.`;

    const modelsToTry = [
      "openrouter/auto",
      "nvidia/nemotron-3.5-lightning:free",
      "liquid/lfm-2.5-2.6b:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "google/gemini-2.0-flash-exp:free"
    ];

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://joseph-speech.vercel.app",
            "X-Title": "PromptFlow Teleprompter"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`Model ${model} failed (${response.status}): ${errText}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (content) {
          return res.status(200).json({ success: true, script: content.trim(), model: model });
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error("All AI models failed");
  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to generate script" });
  }
};
