const { translateTextsWithCache } = require("../services/translationCacheService");

const translateTexts = async (req, res) => {
  try {
    const { texts, targetLang, forceTranslate } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts array is required" });
    }

    if (!targetLang || !["en", "zh"].includes(targetLang)) {
      return res.status(400).json({ error: "targetLang must be 'en' or 'zh'" });
    }

    const translations = await translateTextsWithCache(texts, targetLang, {
      forceTranslate: Boolean(forceTranslate),
    });
    res.status(200).json({ translations });
  } catch (error) {
    console.error("❌ Translation Error:", error.message);
    res.status(500).json({ error: "Translation failed" });
  }
};

module.exports = { translateTexts };
