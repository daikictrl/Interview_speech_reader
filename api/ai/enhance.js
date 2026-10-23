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
    const { text, mode } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
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
      "You are an expert teleprompter script editor. " +
      "Your job is to transform raw written text into oral, spoken-word excellence for teleprompter delivery. " +
      "Format with: short natural breath chunks, clear capitalization for emphasis, phonetic pronunciation in parentheses for difficult words, and cues like [PAUSE 2s]. " +
      "Return ONLY the refined teleprompter script without meta commentary.";

    let prompt = "";
    if (mode === "add_pauses") {
      prompt = `Add dramatic pauses [PAUSE 1s] or [PAUSE 2s] and emphasis to this script to make the delivery sound confident and natural:\n\n${text}`;
    } else if (mode === "bullet_cues") {
      prompt = `Condense this text into punchy speaking cues and bullet teleprompter notes for a keynote speaker:\n\n${text}`;
    } else if (mode === "simplify") {
      prompt = `Rewrite this text into simple, crystal-clear conversational language that rolls off the tongue without stuttering:\n\n${text}`;
    } else {
      prompt = `Optimize this text specifically for a teleprompter. Break long sentences into short breath units, emphasize key takeaway words, and format for effortless reading:\n\n${text}`;
    }

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
          return res.status(200).json({ success: true, refined: content.trim(), model: model });
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error("All AI models failed");
  } catch (error) {
    console.error("AI Enhance Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to enhance script" });
  }
};
