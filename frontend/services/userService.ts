// services/userService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/users";
// const BASE_URL = "http://localhost:8080/api/users"; // Adjust as needed

export const fetchUserProfile = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) throw new Error("No user ID found");

    const response = await fetch(`${BASE_URL}/profile/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch profile");
    console.log("🚀 Fetched user profile from backend");
    return await response.json();
  } catch (error: any) {
    console.error("Profile Fetch Error:", error.message);
    throw error;
  }
};

export const updateUserProfile = async (updatedData: {
  name: string;
  phone: string;
}) => {
  const userId = await AsyncStorage.getItem("userId");
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/users/update/${userId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    },
  );
  return await response.json();
};
