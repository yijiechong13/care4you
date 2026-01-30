const OpenAI = require("openai");
const { TranslationModel } = require("../models/translationModel");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CJK_REGEX = /[\u4E00-\u9FFF]/;

const LANGUAGE_LABELS = {
  en: "English",
  zh: "Simplified Chinese",
};

const detectLang = (text) => (CJK_REGEX.test(text) ? "zh" : "en");

const shouldTranslate = (text, targetLang, options = {}) => {
  if (!text || !text.trim()) return false;
  if (options.forceTranslate) return true;
  const sourceLang = detectLang(text);
  return sourceLang !== targetLang;
};

const translateTextArray = async (texts, targetLang) => {
  if (!process.env.OPENAI_API_KEY) return texts;
  if (!texts || texts.length === 0) return [];

  const targetLanguage = LANGUAGE_LABELS[targetLang] || targetLang;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          `You are a translator for a Singapore community app. Translate the following texts to ${targetLanguage}.\n\n` +
          "Location rules:\n" +
          "- For ALL locations when translating to Chinese, output: Chinese + a space + English. If the input is already Chinese and no English is provided, translate the Chinese into English and append it. Examples:\n" +
          "   Bishan MRT → 碧山地铁站 Bishan MRT, Jurong East MRT → 裕廊东地铁站 Jurong East MRT, Tampines Mall → 淡滨尼商场 Tampines Mall, Boon Lay Community Club → 文礼民众俱乐部 Boon Lay Community Club, MTC Office → MTC 办公室 MTC Office, Singapore Chinese Cultural Centre → 新加坡华族文化中心 Singapore Chinese Cultural Centre.\n" +
          "   Do NOT partially translate — every word must be translated in the Chinese portion (MRT → 地铁站, Office → 办公室, Club → 俱乐部, Centre → 中心, etc.).\n" +
          "- Keep bus stop numbers, Block/Blk numbers, street addresses (Lorong, Jalan, etc.), unit numbers, and postal codes in English.\n" +
          "- If no official Chinese name exists for a location, keep it in English.\n\n" +
          "Output rules:\n" +
          "- When translating to English, output English only (remove any Chinese content).\n" +
          "- When translating to Chinese, follow the location rule above.\n" +
          "Return ONLY a JSON array of translated strings, in the same order. No explanations, no markdown, just the JSON array.",
      },
      {
        role: "user",
        content: JSON.stringify(texts),
      },
    ],
    temperature: 0.1,
  });

  const responseText = completion.choices[0].message.content.trim();
  return JSON.parse(responseText);
};

const translateTextsWithCache = async (texts, targetLang, options = {}) => {
  if (!Array.isArray(texts) || texts.length === 0) return texts || [];
  const lang = (targetLang || "en").toLowerCase();
  if (!['en', 'zh'].includes(lang)) return texts;

  const results = new Array(texts.length);
  const neededMap = new Map();
  const neededTexts = [];

  for (let i = 0; i < texts.length; i++) {
    const text = typeof texts[i] === "string" ? texts[i] : "";
    if (!text || !text.trim()) {
      results[i] = text || "";
      continue;
    }

    if (!shouldTranslate(text, lang, options)) {
      results[i] = text;
      continue;
    }

    if (!neededMap.has(text)) {
      neededMap.set(text, []);
      neededTexts.push(text);
    }
    neededMap.get(text).push(i);
  }

  if (neededTexts.length === 0) return results;

  let cached = new Map();
  try {
    cached = await TranslationModel.findBySourceAndTarget(neededTexts, lang);
  } catch (error) {
    console.error("❌ Translation Cache Lookup Error:", error.message);
  }

  const missing = [];
  for (const text of neededTexts) {
    const cachedText = cached.get(text);
    if (cachedText) {
      const indices = neededMap.get(text) || [];
      indices.forEach((index) => {
        results[index] = cachedText;
      });
    } else {
      missing.push(text);
    }
  }

  if (missing.length === 0) return results;

  let translatedMissing = [];
  try {
    translatedMissing = await translateTextArray(missing, lang);
  } catch (error) {
    console.error("❌ Translation API Error:", error.message);
    translatedMissing = missing;
  }

  const toUpsert = [];
  for (let i = 0; i < missing.length; i++) {
    const sourceText = missing[i];
    const translatedText = translatedMissing[i] || sourceText;
    const indices = neededMap.get(sourceText) || [];
    indices.forEach((index) => {
      results[index] = translatedText;
    });
    if (translatedText && translatedText !== sourceText) {
      toUpsert.push({
        source_text: sourceText,
        target_lang: lang,
        translated_text: translatedText,
      });
    }
  }

  if (toUpsert.length > 0) {
    try {
      await TranslationModel.upsertTranslations(toUpsert);
    } catch (error) {
      console.error("❌ Translation Cache Save Error:", error.message);
    }
  }

  return results;
};

const translateFieldsWithCache = async (fields, targetLang) => {
  const entries = Object.entries(fields || {});
  if (entries.length === 0) return fields;

  const keys = [];
  const texts = [];
  entries.forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      keys.push(key);
      texts.push(value);
    }
  });

  if (texts.length === 0) return fields;

  const translated = await translateTextsWithCache(texts, targetLang);
  const result = { ...fields };
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = translated[i] || result[keys[i]];
  }

  return result;
};

module.exports = {
  translateTextsWithCache,
  translateFieldsWithCache,
  detectLang,
  CJK_REGEX,
};
