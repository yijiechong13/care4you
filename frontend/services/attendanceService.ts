// Follows your existing pattern for API routing
const API_URL = process.env.EXPO_PUBLIC_API_URL + "/attendance";

// const API_URL = "http://137.132.26.212:8080/api/attendance";
export interface AttendancePayload {
  uID: string; // User/Guest ID
  eID: string; // Event ID
  rID: string; // Registration ID
  ts: number; // Timestamp from QR
}

/**
 * Marks a participant as attended using data scanned from their QR code.
 */
export const markAttendance = async (attendanceData: AttendancePayload) => {
  try {
    const response = await fetch(`${API_URL}/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendanceData),
    });

    const result = await response.json();
    console.log("Attendance Response:", response.status, result);
    if (!response.ok) {
      // Handle specific error cases (like expired QR or already checked in)
      throw new Error(result.error || "Failed to record attendance");
    }

    return result;
  } catch (error) {
    console.error("Attendance Service Error:", error);
    throw error;
  }
};

/**
 * Optional: Fetch attendance history for a specific event (Staff View)
 */
export const fetchEventAttendance = async (eventId: string) => {
  try {
    const response = await fetch(`${API_URL}/event/${eventId}`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Event Attendance Failed:", error);
    return [];
  }
};
