import { getCurrentLanguage } from "@/lib/i18n";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const fetchAnnouncements = async () => {
  try {
    const lang = getCurrentLanguage() || "en";
    const response = await fetch(
      `${BASE_URL}/announcements?lang=${encodeURIComponent(lang)}`,
    );
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const rawData = await response.json();

    // Format dates nicely for the UI
    return rawData.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      message: item.message,
      location: item.location || null,
      date: new Date(item.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }));

  } catch (error) {
    console.error("Fetch Announcements Failed:", error);
    return [];
  }
};

export const postAnnouncement = async (title: string, message: string, location?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/announcements/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message, location }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to post announcement");
    }

    return result;
  } catch (error) {
    console.error("Post Announcement Failed:", error);
    throw error;
  }
};
