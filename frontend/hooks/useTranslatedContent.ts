import { useState, useEffect, useRef } from "react";
import { useLanguage } from "./useLanguage";
import { translateTexts } from "@/services/translateService";

// Global cache persists across component mounts
const translationCache = new Map<string, string>();

function getCacheKey(text: string, lang: string): string {
  return `${text}::${lang}`;
}

/**
 * Hook that translates an array of texts to the user's current language.
 * Returns original texts while loading or if language is English (assumes content is in English).
 * Falls back to original texts on error.
 */
export function useTranslatedContent(texts: string[]): string[] {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState<string[]>(texts);
  const prevKey = useRef<string>("");

  useEffect(() => {
    // Create a stable key from the texts + language to avoid unnecessary re-fetches
    const key = `${language}::${texts.join("||")}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    // If English, assume content is already in English — no translation needed
    if (language === "en") {
      setTranslated(texts);
      return;
    }

    // Check which texts are already cached
    const results = [...texts];
    const uncachedIndices: number[] = [];

    for (let i = 0; i < texts.length; i++) {
      if (!texts[i] || !texts[i].trim()) continue;
      const cached = translationCache.get(getCacheKey(texts[i], language));
      if (cached) {
        results[i] = cached;
      } else {
        uncachedIndices.push(i);
      }
    }

    // If everything is cached, set immediately
    if (uncachedIndices.length === 0) {
      setTranslated(results);
      return;
    }

    let cancelled = false;

    const doTranslate = async () => {
      try {
        const response = await translateTexts(texts, language);
        if (cancelled) return;

        // Cache all results
        for (let i = 0; i < response.length; i++) {
          if (texts[i] && texts[i].trim() && response[i]) {
            translationCache.set(getCacheKey(texts[i], language), response[i]);
          }
        }

        setTranslated(response);
      } catch {
        // Keep original texts on error
        if (!cancelled) setTranslated(texts);
      }
    };

    doTranslate();

    return () => {
      cancelled = true;
    };
  }, [texts.join("||"), language]);

  return translated;
}
