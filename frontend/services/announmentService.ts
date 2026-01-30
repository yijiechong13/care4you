import { getCurrentLanguage } from "@/lib/i18n";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
// const BASE_URL = "http://localhost:8080/api";

export const fetchAnnouncements = async (userId?: string) => {
  try {
    const lang = getCurrentLanguage() || "en";

    const params = new URLSearchParams();
    params.append("lang", lang);
    if (userId) {
      params.append("userId", userId);
    }

    const response = await fetch(
      `${BASE_URL}/announcements?${params.toString()}`,
    );

    const rawData = await response.json();

    // Format dates nicely for the UI
    return rawData.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      message: item.message,
      location: item.location || null,
      relatedEventId: item.related_event_id || null,
      isRead: !!item.isRead,
      date: new Date(item.createdAt).toLocaleString("en-GB", {
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

export const postAnnouncement = async (title: string, message: string) => {
  try {
    const response = await fetch(`${BASE_URL}/announcements/global`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message }),
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

export const postEventAnnouncement = async (eventId: string, title: string, message: string) => {
  try {
    const response = await fetch(`${BASE_URL}/announcements/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, title, message }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to post event announcement");
    }

    return result;
  } catch (error) {
    console.error("Post Event Announcement Failed:", error);
    throw error;
  }
};

export const markAnnouncementRead = async (announcementId: string, userId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/announcements/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ announcementId, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }
    
    return true;
  } catch (error) {
    console.error("Mark Read Failed:", error);
    return false;
  }
};