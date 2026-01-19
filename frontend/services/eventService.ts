import { Platform } from "react-native";

// CHANGE TO DEPLOYED BACKEND events
const API_URL = process.env.EXPO_PUBLIC_API_URL + "/events";

// const API_URL = "http://localhost:8080/api/events";

export const fetchEvents = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const rawData = await response.json();

    return rawData.map((event: any) => {
      const dateObj = new Date(event.start_time);
      const endTimeObj = new Date(event.end_time);
      const dateStr = dateObj.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const startTimeStr = dateObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endTimeStr = endTimeObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Transform event_images to frontend format
      const eventImages = event.event_images || [];
      const primaryImage =
        eventImages.find((img: any) => img.is_primary) || eventImages[0];
      const images = eventImages.map((img: any) => ({
        id: img.id.toString(),
        url: img.image_url,
        caption: img.caption,
        displayOrder: img.display_order,
        isPrimary: img.is_primary,
      }));

      return {
        id: event.id.toString(),
        title: event.title,
        date: dateObj.toISOString(), // ISO format for calendar parsing
        dateDisplay: dateStr, // Formatted string for display
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: event.location,
        participantSlots: event.participant_slots,
        volunteerSlots: event.volunteer_slots,
        takenSlots: event.taken_slots,
        volunteerTakenSlots: event.volunteer_taken_slots,
        imageUrl: primaryImage?.image_url || event.image_url, // Fallback to old field
        images: images.length > 0 ? images : undefined,
        eventStatus: event.eventStatus,
      };
    });
  } catch (error) {
    console.error("Fetch Failed:", error);
    return [];
  }
};

export const publishEvent = async (eventData: any, questions: any[]) => {
  try {
    const payload = {
      ...eventData,
      questions: questions,
    };

    console.log("🚀 Sending to backend:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to publish event");
    }

    return result;
  } catch (error) {
    console.error("Service Error:", error);
    throw error;
  }
};

// Fetch questions for an event (for registration form)
export const fetchEventQuestions = async (eventId: string) => {
  try {
    const response = await fetch(`${API_URL}/${eventId}/questions`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Questions Failed:", error);
    return [];
  }
};

// Fetch all registrations for a user (for My Events page)
export const fetchUserRegistrations = async (userId: string) => {
  try {
    const response = await fetch(
      `${API_URL.replace("/events", "/registrations")}/user/${userId}`,
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const rawData = await response.json();
    console.log(rawData);

    // Transform the data to match frontend Event format
    return rawData.map((registration: any) => {
      const event = registration.events; // joined from backend
      const dateObj = new Date(event.start_time);
      const endTimeObj = new Date(event.end_time);

      const answers = registration.registration_answers || [];
      const selectedResponses = answers
        .map((answer: any) => ({
          question: answer.event_questions?.question_text || "Question",
          answer: answer.question_options?.option_text || "N/A",
        }))
        .filter((entry: any) => entry.question || entry.answer);

      // Determine status based on date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDate = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
      );

      let status: "today" | "upcoming" | "completed";
      if (eventDate.getTime() === today.getTime()) {
        status = "today";
      } else if (eventDate < today) {
        status = "completed";
      } else {
        status = "upcoming";
      }

      return {
        id: event.id.toString(),
        reminders: event.reminders,
        title: event.title,
        date: dateObj,
        startTime: dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        endTime: endTimeObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        status,
        venue: event.location,
        selectedResponses:
          selectedResponses.length > 0 ? selectedResponses : undefined,
        registrationId: registration.id,
        eventStatus: event.eventStatus,
      };
    });
  } catch (error) {
    console.error("Fetch User Registrations Failed:", error);
    return [];
  }
};

export const submitRegistration = async (registrationData: {
  eventId: string;
  userId: string;
  specialRequirements?: string;
  fullName?: string;
  contactNumber?: string;
  emergencyContact?: string;
  answers: { questionId: number; selectedOptionId: number }[];
}) => {
  try {
    const response = await fetch(
      `${API_URL.replace("/events", "/registrations")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to submit registration");
    }

    return result;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

// Fetch detailed registrations for CSV export (staff only)
export const fetchRegistrationsForExport = async (eventId: string) => {
  try {
    const response = await fetch(
      `${API_URL.replace("/events", "/registrations")}/export/${eventId}`,
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Registrations For Export Failed:", error);
    return [];
  }
};

// Fetch registration counts by user type for multiple events (for staff view)
export const fetchRegistrationCounts = async (eventIds: string[]) => {
  try {
    const response = await fetch(
      `${API_URL.replace("/events", "/registrations")}/counts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventIds }),
      },
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Registration Counts Failed:", error);
    return {};
  }
};

// Fetch images for a specific event
export const fetchEventImages = async (eventId: string) => {
  try {
    const response = await fetch(`${API_URL}/${eventId}/images`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch Event Images Failed:", error);
    return [];
  }
};

// Add image to an event
export const addEventImage = async (
  eventId: string,
  imageUrl: string,
  displayOrder: number = 0,
  isPrimary: boolean = false,
  caption?: string,
  userId?: string,
) => {
  try {
    const response = await fetch(`${API_URL}/${eventId}/images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        displayOrder,
        isPrimary,
        caption,
        userId,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to add image");
    }
    return result;
  } catch (error) {
    console.error("Add Event Image Failed:", error);
    throw error;
  }
};

// Delete an event image
export const deleteEventImage = async (imageId: string) => {
  try {
    const response = await fetch(`${API_URL}/images/${imageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to delete image");
    }
    return true;
  } catch (error) {
    console.error("Delete Event Image Failed:", error);
    throw error;
  }
};

export const cancelEvent = async (eventId: string) => {
  try {
    const response = await fetch(`${API_URL}/${eventId}/cancel`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error("Failed to cancel event");
    }

    return true;
  } catch (error) {
    console.error("Cancel Event Failed:", error);
    throw error;
  }
};
