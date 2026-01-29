const OpenAI = require("openai");

const OpenAIClient = OpenAI.default ?? OpenAI;
const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

const LANGUAGE_NAMES = {
  en: "English",
  zh: "Chinese (Simplified)",
};

const translateFields = async (fields, targetLang) => {
  const lang = (targetLang || "en").toLowerCase();
  if (lang === "en") return fields;
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
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Translate all string values in the JSON to the target language. " +
            "Return only valid JSON with the same keys. Keep emojis, line breaks, and punctuation. " +
            "Do not add explanations.",
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
