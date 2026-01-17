import { Platform } from 'react-native';

// CHANGE TO DEPLOYED BACKEND URL
const API_URL = 'http://localhost:8080/api/events';

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
      const dateStr = dateObj.toLocaleDateString('en-GB', { 
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
      });
      const startTimeStr = dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      });
      const endTimeStr = endTimeObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      });

      return {
        id: event.id.toString(),
        title: event.title,
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: event.location,
        totalSlots: event.total_slots,
        takenSlots: event.taken_slots,
        imageUrl: event.image_url,
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
      questions: questions
    };

    console.log("🚀 Sending to backend:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`${API_URL.replace('/events', '/registrations')}/user/${userId}`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const rawData = await response.json();

    // Transform the data to match frontend Event format
    return rawData.map((registration: any) => {
      const event = registration.events; // joined from backend
      const dateObj = new Date(event.start_time);
      const endTimeObj = new Date(event.end_time);

      // Determine status based on date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

      let status: 'today' | 'upcoming' | 'completed';
      if (eventDate.getTime() === today.getTime()) {
        status = 'today';
      } else if (eventDate < today) {
        status = 'completed';
      } else {
        status = 'upcoming';
      }

      return {
        id: event.id.toString(),
        title: event.title,
        date: dateObj,
        startTime: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        endTime: endTimeObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status,
        venue: event.location,
        registrationId: registration.id,
      };
    });
  } catch (error) {
    console.error("Fetch User Registrations Failed:", error);
    return [];
  }
};

export const submitRegistration = async (registrationData: {
  eventId: string;
  userId: string | null;
  specialRequirements?: string;
  isGuest: boolean;
  fullName?: string;
  contactNumber?: string;
  emergencyContact?: string;
  answers: { questionId: number; selectedOptionId: number }[];
}) => {
  try {
    const response = await fetch(`${API_URL.replace('/events', '/registrations')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

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