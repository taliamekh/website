const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT =
  "You are Spocket, a study assistant for Talia's Student Resources. " +
  "Answer questions using only the provided notes excerpts. Be concise, helpful, " +
  "and reference specific sections when possible. If the answer isn't in the excerpts, say so. " +
  "Keep answers under 300 words. Use bold (**word**) for key terms.";

/* Common words to ignore when extracting keywords from the question */
const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "i","me","my","we","our","you","your","he","she","it","they","them","their",
  "this","that","these","those","what","which","who","whom","how","when","where",
  "why","if","then","so","but","and","or","not","no","of","in","on","at","to",
  "for","with","by","from","about","into","through","between","after","before",
  "during","above","below","up","down","out","off","over","under","again","there",
  "here","all","each","every","both","few","more","most","other","some","any",
  "such","than","too","very","just","also","tell","explain","describe","define",
  "mean","means","formula","equation","calculate","find","show","give","example",
]);

/**
 * Extract meaningful keywords from the student's question.
 * Returns an array of lowercase keywords, stripped of stop words.
 */
function extractKeywords(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Search the full notes context for paragraphs containing any of the keywords.
 * Returns only the relevant excerpts, capped at maxChars total.
 */
function extractRelevantSections(fullContext, keywords, maxChars) {
  if (!fullContext || keywords.length === 0) return fullContext?.slice(0, maxChars) || "";

  // Split into paragraphs (double newline) or fall back to single newlines
  const paragraphs = fullContext.split(/\n{2,}/).filter((p) => p.trim().length > 20);

  // Score each paragraph by how many keywords it contains
  const scored = paragraphs.map((p) => {
    const lower = p.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      // Count occurrences, weight longer keyword matches higher
      const regex = new RegExp(kw, "gi");
      const matches = lower.match(regex);
      if (matches) score += matches.length * kw.length;
    }
    return { text: p.trim(), score };
  });

  // Sort by score descending, take top matches
  scored.sort((a, b) => b.score - a.score);

  // Collect paragraphs until we hit the char limit
  let result = "";
  let count = 0;
  for (const item of scored) {
    if (item.score === 0) break; // No more relevant paragraphs
    if (result.length + item.text.length > maxChars) {
      if (count === 0) {
        // At least include a truncated version of the best match
        result = item.text.slice(0, maxChars);
        count++;
      }
      break;
    }
    result += (count > 0 ? "\n\n" : "") + item.text;
    count++;
  }

  // If nothing matched, fall back to first chunk of context
  if (count === 0) {
    return fullContext.slice(0, maxChars);
  }

  return result;
}

module.exports = async function handler(req, res) {
  // Allow CORS
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

  const recentMessages = messages.slice(-10);
  const latestQuestion = recentMessages[recentMessages.length - 1]?.content || "";

  // Extract keywords from the question and find only relevant sections
  const keywords = extractKeywords(latestQuestion);
  const fullContext = typeof context === "string" ? context : "";
  const relevantContext = extractRelevantSections(fullContext, keywords, 4000);

  // Build Gemini request
  const contents = [];
  const firstMsg = recentMessages[0];

  if (relevantContext && firstMsg) {
    contents.push({
      role: "user",
      parts: [{ text: "RELEVANT NOTES EXCERPTS:\n\n" + relevantContext + "\n\n---\n\nQUESTION: " + firstMsg.content }],
    });
    for (let i = 1; i < recentMessages.length; i++) {
      contents.push({
        role: recentMessages[i].role === "assistant" ? "model" : "user",
        parts: [{ text: recentMessages[i].content }],
      });
    }
  } else {
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
