const OpenAI = require("openai");

const OpenAIClient = OpenAI.default ?? OpenAI;
const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

const LANGUAGE_NAMES = {
  en: "English",
  zh: "Chinese (Simplified)",
};

const CJK_REGEX = /[\u4E00-\u9FFF]/;

const translateFields = async (fields, targetLang) => {
  const lang = (targetLang || "en").toLowerCase();
  const needsEnglishTranslation =
    lang === "en" &&
    Object.values(fields).some(
      (value) => typeof value === "string" && CJK_REGEX.test(value),
    );
  if (lang === "en" && !needsEnglishTranslation) return fields;
  if (!process.env.OPENAI_API_KEY) return fields;

  const inputFields = Object.entries(fields).reduce((acc, [key, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (Object.keys(inputFields).length === 0) {
    return fields;
  }

  const languageName = LANGUAGE_NAMES[lang] || lang;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a translator for a Singapore community app.\n\n" +
            "Rules (must follow strictly):\n" +
            "1. Translate all string values in the JSON to the target language.\n" +
            "2. For ALL named places, translate the FULL name into Chinese (including the place type like MRT/Office/Club), then append the FULL original English name after it. Examples:\n" +
            "   - Bishan MRT → 碧山地铁站 Bishan MRT (MRT must become 地铁站)\n" +
            "   - Jurong East MRT → 裕廊东地铁站 Jurong East MRT\n" +
            "   - Tampines Mall → 淡滨尼商场 Tampines Mall\n" +
            "   - Boon Lay Community Club → 文礼民众俱乐部 Boon Lay Community Club\n" +
            "   - Singapore Chinese Cultural Centre → 新加坡华族文化中心 Singapore Chinese Cultural Centre\n" +
            "   - MTC Office → MTC 办公室 MTC Office (keep acronyms, translate 'Office')\n" +
            "   - Toa Payoh HDB Hub → 大巴窑组屋中心 Toa Payoh HDB Hub\n" +
            "   Do NOT partially translate — every word in the name must be translated in the Chinese portion (MRT → 地铁站, Office → 办公室, Club → 俱乐部, Centre → 中心, etc.).\n" +
            "3. Keep the following in English (do NOT translate):\n" +
            "   - Bus stop numbers (e.g., Bus Stop 59049)\n" +
            "   - Block/Blk numbers (e.g., Blk 123)\n" +
            "   - Street addresses (e.g., Lorong 4, Jalan Bukit Merah)\n" +
            "   - Unit/Apt numbers\n" +
            "   - Postal codes\n" +
            "4. If no official Chinese name exists for a location, keep it in English.\n\n" +
            "Output rules:\n" +
            "- Return ONLY valid JSON.\n" +
            "- Keep the same keys and structure.\n" +
            "- Keep emojis, line breaks, and punctuation.\n" +
            "- Do NOT add explanations or extra fields.",
        },
        {
          role: "user",
          content: `Target language: ${languageName}. JSON: ${JSON.stringify(
            inputFields,
          )}`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return fields;

    const parsed = JSON.parse(content);
    return { ...fields, ...parsed };
  } catch (error) {
    console.error("❌ Translation Error:", error.message);
    return fields;
  }
};

module.exports = { translateFields };
