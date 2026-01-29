const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache: "text::targetLang" -> translated text
const cache = new Map();

const translateTexts = async (req, res) => {
  try {
    const { texts, targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts array is required" });
    }

    if (!targetLang || !["en", "zh"].includes(targetLang)) {
      return res.status(400).json({ error: "targetLang must be 'en' or 'zh'" });
    }

    const targetLanguage = targetLang === "zh" ? "Simplified Chinese" : "English";

    // Check cache and find which texts need translation
    const results = new Array(texts.length);
    const toTranslate = []; // { index, text }

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || !text.trim()) {
        results[i] = text || "";
        continue;
      }
      const cacheKey = `${text}::${targetLang}`;
      if (cache.has(cacheKey)) {
        results[i] = cache.get(cacheKey);
      } else {
        toTranslate.push({ index: i, text });
      }
    }

    // If everything was cached, return immediately
    if (toTranslate.length === 0) {
      return res.status(200).json({ translations: results });
    }

    // Batch translate uncached texts
    const textsToTranslate = toTranslate.map((item) => item.text);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following texts to ${targetLanguage}. Return ONLY a JSON array of translated strings, in the same order. No explanations, no markdown, just the JSON array.`,
        },
        {
          role: "user",
          content: JSON.stringify(textsToTranslate),
        },
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0].message.content.trim();
    const translations = JSON.parse(responseText);

    // Store results and update cache
    for (let i = 0; i < toTranslate.length; i++) {
      const { index, text } = toTranslate[i];
      const translated = translations[i] || text;
      results[index] = translated;
      cache.set(`${text}::${targetLang}`, translated);
    }

    res.status(200).json({ translations: results });
  } catch (error) {
    console.error("❌ Translation Error:", error.message);
    res.status(500).json({ error: "Translation failed" });
  }
};

module.exports = { translateTexts };
