const { supabase } = require("../config/supabase");

const TRANSLATIONS_TABLE = process.env.TRANSLATIONS_TABLE || "translations";

const TranslationModel = {
  findBySourceAndTarget: async (sourceTexts, targetLang) => {
    const uniqueTexts = Array.from(
      new Set(
        (sourceTexts || [])
          .filter((text) => typeof text === "string")
          .map((text) => text.trim())
          .filter((text) => text.length > 0),
      ),
    );

    if (uniqueTexts.length === 0) return new Map();

    const { data, error } = await supabase
      .from(TRANSLATIONS_TABLE)
      .select("source_text, translated_text, target_lang")
      .eq("target_lang", targetLang)
      .in("source_text", uniqueTexts);

    if (error) throw new Error(error.message);

    const results = new Map();
    (data || []).forEach((row) => {
      if (row.source_text && row.translated_text) {
        results.set(row.source_text, row.translated_text);
      }
    });

    return results;
  },

  upsertTranslations: async (rows) => {
    const payload = (rows || []).filter(
      (row) =>
        row &&
        typeof row.source_text === "string" &&
        typeof row.target_lang === "string" &&
        typeof row.translated_text === "string" &&
        row.source_text.trim().length > 0 &&
        row.target_lang.trim().length > 0 &&
        row.translated_text.trim().length > 0,
    );

    if (payload.length === 0) return;

    const { error } = await supabase
      .from(TRANSLATIONS_TABLE)
      .upsert(payload, { onConflict: "source_text,target_lang" });

    if (!error) return;

    console.warn(
      "⚠️ Translation upsert failed, falling back to insert:",
      error.message,
    );
    const { error: insertError } = await supabase
      .from(TRANSLATIONS_TABLE)
      .insert(payload);

    if (insertError) throw new Error(insertError.message);
  },
};

module.exports = { TranslationModel };
