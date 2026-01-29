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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            `You are a translator for a Singapore community app. Translate the following texts to ${targetLanguage}.\n\n` +
            "Location rules:\n" +
            "- For ALL named places, translate the FULL name into Chinese (including the place type like MRT/Office/Club), then append the FULL original English name after it. Examples:\n" +
            "   Bishan MRT → 碧山地铁站 Bishan MRT, Jurong East MRT → 裕廊东地铁站 Jurong East MRT, Tampines Mall → 淡滨尼商场 Tampines Mall, Boon Lay Community Club → 文礼民众俱乐部 Boon Lay Community Club, MTC Office → MTC 办公室 MTC Office, Singapore Chinese Cultural Centre → 新加坡华族文化中心 Singapore Chinese Cultural Centre.\n" +
            "   Do NOT partially translate — every word must be translated in the Chinese portion (MRT → 地铁站, Office → 办公室, Club → 俱乐部, Centre → 中心, etc.).\n" +
            "- Keep bus stop numbers, Block/Blk numbers, street addresses (Lorong, Jalan, etc.), unit numbers, and postal codes in English.\n" +
            "- If no official Chinese name exists for a location, keep it in English.\n\n" +
            "Return ONLY a JSON array of translated strings, in the same order. No explanations, no markdown, just the JSON array.",
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
