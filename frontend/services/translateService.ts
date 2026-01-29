const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const translateTexts = async (
  texts: string[],
  targetLang: string
): Promise<string[]> => {
  try {
    // Filter out empty strings but keep track of positions
    const nonEmpty = texts.filter((t) => t && t.trim());
    if (nonEmpty.length === 0) return texts;

    const response = await fetch(`${BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, targetLang }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error("Translation service error:", error);
    // Return original texts on failure
    return texts;
  }
};
