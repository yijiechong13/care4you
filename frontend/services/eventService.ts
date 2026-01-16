import { Platform } from 'react-native';

const API_URL = 'http://172.31.91.190:8080/api/events';

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
      };
    });

  } catch (error) {
    console.error("Fetch Failed:", error);
    return [];
  }
};