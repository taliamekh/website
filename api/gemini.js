const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT =
  "You are Spocket, a study assistant for Talia's Student Resources. " +
  "Answer questions using only the provided notes content. Be concise, helpful, " +
  "and reference specific sections when possible. If the answer isn't in the notes, say so. " +
  "Keep answers under 300 words. Use bold (**word**) for key terms.";

module.exports = async function handler(req, res) {
  // Allow CORS for the notes page
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Truncate context to ~15K chars to stay well within free tier token limits
  const trimmedContext = typeof context === "string" ? context.slice(0, 15000) : "";
  const recentMessages = messages.slice(-10);

  // Build Gemini request — context + question in a single user message
  const contents = [];

  // Combine context and first question into one message to reduce request overhead
  const firstMsg = recentMessages[0];
  if (trimmedContext && firstMsg) {
    contents.push({
      role: "user",
      parts: [{ text: "NOTES CONTEXT:\n\n" + trimmedContext + "\n\n---\n\nQUESTION: " + firstMsg.content }],
    });
    // Add remaining messages normally
    for (let i = 1; i < recentMessages.length; i++) {
      contents.push({
        role: recentMessages[i].role === "assistant" ? "model" : "user",
        parts: [{ text: recentMessages[i].content }],
      });
    }
  } else {
    // No context — just send messages directly
    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: 1024 },
  };

  try {
    const response = await fetch(GEMINI_URL + "?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const errBody = await response.text().catch(() => "");
      return res.status(429).json({
        error: "Rate limit reached. Try again in a moment.",
        details: errBody,
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      return res.status(502).json({
        error: "Gemini API error: " + response.status,
        details: errText,
      });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Try rephrasing your question.";

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Gemini API", details: err.message });
  }
};
