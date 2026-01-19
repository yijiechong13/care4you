import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/auth";
// const BASE_URL = "http://localhost:8080/api/auth"; // Adjust as needed

export const signupUser = async (userData: any) => {
  const guestId = await AsyncStorage.getItem("userId");

  try {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST", // Telling the server we are sending new data
      headers: {
        "Content-Type": "application/json", // Telling the server to expect JSON
      },
      body: JSON.stringify({
        ...userData,
        guestId:
          guestId && guestId.toString().startsWith("guest_") ? guestId : null, // Only send if it's a guest ID
      }),
    });

    if (!response.ok) {
      // If the server sends an error (like 400 or 500), we jump to the catch block
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return await response.json();
  } catch (error: any) {
    console.error("API Register Error:", error.message);
    throw error; // Passing the error back to the Sign-Up screen to show an Alert
  }
};
